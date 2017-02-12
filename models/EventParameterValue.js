module.exports = (sequelize, DataTypes) => {
  return sequelize.define('EventParameterValue', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.EventParameterValue.belongsTo(models.EventParameter);
      }
    }
  });
};
