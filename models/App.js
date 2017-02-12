module.exports = (sequelize, DataTypes) => {
  return sequelize.define('App', {
    flurry_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.App.hasMany(models.AppVersion);
        models.App.hasMany(models.PageView);
      }
    }
  });
};
