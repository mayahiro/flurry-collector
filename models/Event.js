module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Event', {
    flurry_event_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.Event.hasMany(models.EventCount);
        models.Event.hasMany(models.EventParameter);
      }
    }
  });
};
