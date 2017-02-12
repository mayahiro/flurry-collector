module.exports = (sequelize, DataTypes) => {
  return sequelize.define('EventCount', {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
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
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.EventCount.belongsTo(models.AppVersion);
        models.EventCount.belongsTo(models.Event);
      }
    }
  });
};
