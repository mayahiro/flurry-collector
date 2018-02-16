process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const axios = require('axios');

const settings = require('./settings');

axios.defaults.headers.common['Authorization'] = `Bearer ${settings.flurryProgramaticToken}`;

const Models = require('./models');
const m = new Models(settings.databaseSettings);

m.readModels(() => {
  const models = m.models;
  let apps;
  let appNames;
  let appVersions;
  const startDate = moment().add(-1, 'weeks').format('YYYY-MM-DD');
  const endDate = moment().add(1, 'days').format('YYYY-MM-DD');

  models.App.findAll({raw: true})
    .then(as => {
      apps = as;

      appNames = _.map(apps, 'name').join(',');

      // バージョン収集
      return axios.get('https://api-metrics.flurry.com/public/v1/data/appUsage/all/app;show=all/appVersion', {
        params: {
          filters: `app|name-in[${appNames}]`,
          metrics: 'sessions',
          dateTime: `2015-10-01/${endDate}`
        }
      })
    })
    .then(response => {
      return new Promise((resolve, reject) => {
        Promise.mapSeries((response.data.rows), row => {
          return new Promise((resolve, reject) => {
            // appVersion|nameが空の場合がある（新しいバージョン？）
            if (row['appVersion|name'] !== '') {
              const app = _.find(apps, app => app.flurry_id === row['app|id']);

              const date = moment(row.dateTime).add(1, 'days').toDate();

              models.AppVersion.findOrCreate({
                where: {
                  app_id: app.id,
                  version: row['appVersion|name']
                },
                defaults: {
                  enable_collect: true
                }
              })
                .spread((appVersion, created) => {
                  if (created) {
                    console.log(`new version: ${appVersion.version}`);
                  }
                  resolve();
                });
            } else {
              resolve();
            }
          });
        })
          .then(() => resolve())
          .catch(err => reject(err));
      });
    })
    .then(() => {
      return models.AppVersion.findAll({include: [models.App], raw: true});
    })
    .then(avs => {
      // 利用状況を取得
      appVersions = avs;

      return axios.get('https://api-metrics.flurry.com/public/v1/data/appUsage/day/app;show=all/appVersion', {
        params: {
          filters: `app|name-in[${appNames}]`,
          metrics: 'activeDevices,newDevices,sessions',
          dateTime: `${startDate}/${endDate}`,
          timeZone: 'Asia/Tokyo'
        }
      })
    })
    .then(response => {
      // 利用状況を保存
      return new Promise((resolve, reject) => {
        Promise.mapSeries((response.data.rows), row => {
          return new Promise((resolve, reject) => {
            if (row['appVersion|name'] === '') {
              resolve();
            }

            const appVersion = _.find(appVersions, appVersion => (appVersion['App.flurry_id'] === row['app|id'] && appVersion.version === row['appVersion|name']));

            if (appVersion.enable_collect) {
              const date = moment(row.dateTime).add(9, 'hours').toDate();

              models.AppUsage.findOrCreate({where: {app_version_id: appVersion.id, date: date}})
                .spread((appUsage, created) => {
                  appUsage.active_device_count = row.activeDevices;
                  appUsage.new_device_count = row.newDevices;
                  appUsage.session_count = row.sessions;
                  appUsage.save()
                    .then(() => resolve())
                    .catch(err => reject(err));
                });
            } else {
              resolve();
            }
          });
        })
          .then(() => resolve())
          .catch(err => reject(err));
      });
    })
    .then(() => {
      // アプリバージョン毎にイベント収集
      console.log('collect Events');
      return new Promise((resolve, reject) => {
        Promise.mapSeries((appVersions), appVersion => {
          if (!appVersion.enable_collect) {
            // 対象外
            return;
          }

          return new Promise((resolve, reject) => {
            axios.get('https://api-metrics.flurry.com/public/v1/data/appEvent/day/app/event;show=all/appVersion', {
              params: {
                filters: `app|name-in[${appVersion['App.name']}],appVersion|name-in[${appVersion.version}]`,
                metrics: 'occurrences,activeDevices,newDevices',
                dateTime: `${startDate}/${endDate}`,
                timeZone: 'Asia/Tokyo'
              }
            })
              .then(response => {
                Promise.mapSeries((response.data.rows), row => {
                  return new Promise((resolve, reject) => {
                    const date = moment(row.dateTime).add(9, 'hours').toDate();

                    models.Event.findOrCreate({
                      where: {
                        flurry_event_id: row['event|id']
                      },
                      defaults: {
                        name: row['event|name']
                      }
                    })
                      .spread((event, created) => {
                        event.name = row['event|name'];
                        event.save()
                          .then(() => {
                            models.EventCount.findOrCreate({
                              where: {
                                app_version_id: appVersion.id,
                                event_id: event.id,
                                date: date
                              }
                            })
                              .spread((eventCount, created) => {
                                eventCount.active_device_count = row.activeDevices;
                                eventCount.new_device_count = row.newDevices;
                                eventCount.count = row.occurrences;
                                eventCount.save()
                                  .then(() => resolve())
                                  .catch(err => reject(err));
                              });
                          })
                          .catch(err => reject(err));
                      });
                  });
                })
                  .then(() => resolve())
                  .catch(err => reject(err));
              })
              .catch(err => {
                if (err.response.status === 400) {
                  console.log('err: 400')
                  resolve();
                } else {
                  reject(err);
                }
              });
          });
        })
          .then(() => resolve())
          .catch(err => reject(err));
      });
    })
    .then(() => {
      // イベントパラメーター収集
      console.log('collect Event Parameters');
      return new Promise((resolve, reject) => {
        models.Event.findAll({where: {flurry_event_id: {$ne: '-1'}}, raw: true})
          .then(events => {
            Promise.mapSeries((events), (event) => {
              console.log(`collect Event Parameters(${event.flurry_event_id}:${event.name})`);
              return new Promise((resolve, reject) => {
                // API叩く
                axios.get('https://api-metrics.flurry.com/public/v1/data/eventParams/day/app;show=all/event/paramName/paramValue/appVersion', {
                  params: {
                    filters: `event|id-in[${event.flurry_event_id}]`,
                    metrics: 'count',
                    dateTime: `${startDate}/${endDate}`,
                    timeZone: 'Asia/Tokyo'
                  }
                })
                  .then(response => {
                    if (response.data.rows.length === 0) {
                      resolve();
                      return;
                    }

                    Promise.mapSeries((response.data.rows), row => {
                      return new Promise((resolve, reject) => {
                        if (row['appVersion|name'] === '') {
                          resolve();
                        }

                        const date = moment(row.dateTime).add(9, 'hours').toDate();

                        // EventParameterをfindOrCreate
                        models.EventParameter.findOrCreate({
                          where: {
                            event_id: event.id,
                            name: row['paramName|name']
                          }
                        })
                          .spread((eventParameter, created) => {
                            // EventParameterValueをfindOrCreate
                            models.EventParameterValue.findOrCreate({
                              where: {
                                event_parameter_id: eventParameter.id,
                                name: row['paramValue|name']
                              }
                            })
                              .spread((eventParameterValue, created) => {
                                const appVersion = _.find(appVersions, appVersion => (appVersion['App.flurry_id'] === row['app|id'] && appVersion.version === row['appVersion|name']));

                                if (appVersion === undefined) {
                                  console.log('no appVersion|name');
                                  resolve();
                                  return;
                                }

                                // EventPatameterValueCountをfindOrCreate
                                models.EventParameterValueCount.findOrCreate({
                                  where: {
                                    app_version_id: appVersion.id,
                                    event_parameter_value_id: eventParameterValue.id,
                                    date: date
                                  },
                                  defaults: {
                                    count: 0
                                  }
                                })
                                  .spread((eventParameterValueCount, created) => {
                                    eventParameterValueCount.count = row.count;
                                    eventParameterValueCount.save()
                                      .then(() => resolve())
                                      .catch(err => reject(err));
                                  });
                              });
                          });
                      });
                    })
                      .then(() => resolve())
                      .catch(err => reject(err));
                  })
                  .catch(err => {
                    console.log(`error Event Parameters(${event.flurry_event_id}:${event.name})`);
                    if (err.response) {
                      resolve();
                    } else {
                      reject(err);
                    }
                  });
              });
            })
              .then(() => resolve())
              .catch(err => reject(err));
          })
          .catch(err => reject(err));
      });
    })
    .then(() => console.log('done!'))
    .catch(err => console.error(err));
});
