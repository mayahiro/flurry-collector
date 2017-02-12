const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

class Database {
  constructor(databaseSettings) {
    this.Sequelize = Sequelize;
    this.sequelize = new Sequelize(databaseSettings.database, databaseSettings.username, databaseSettings.password, {
      logging: false,
      dialectOptions: databaseSettings.dialectOptions,
      define: {
        paranoid: true,
        underscored: true,
        underscoredAll: true
      }
    });
    this.models = {};
  }

  readModels(callback) {
    fs.readdirSync(__dirname)
      .filter((file) => {
        return (file.indexOf('.') !== 0) && (file !== 'index.js');
      })
      .forEach((file) => {
        const model = this.sequelize.import(path.join(__dirname, file));
        this.models[model.name] = model;
      });

    Object.keys(this.models).forEach((modelName) => {
      if ('associate' in this.models[modelName]) {
        this.models[modelName].associate(this.models);
      }
    });

    callback();
  }
}

module.exports = Database;
