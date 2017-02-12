module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AppUsage', {
    active_device_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    new_device_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    session_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.AppUsage.belongsTo(models.AppVersion);
      }
    }
  });
};
