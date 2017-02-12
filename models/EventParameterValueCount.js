module.exports = (sequelize, DataTypes) => {
  return sequelize.define('EventParameterValueCount', {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.EventParameterValueCount.belongsTo(models.AppVersion);
        models.EventParameterValueCount.belongsTo(models.EventParameterValue);
      }
    }
  });
};
