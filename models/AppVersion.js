module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AppVersion', {
    version: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    enable_collect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.AppVersion.belongsTo(models.App);
        models.AppVersion.hasMany(models.AppUsage);
        models.AppVersion.hasMany(models.EventCount);
      }
    }
  });
};
