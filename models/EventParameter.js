module.exports = (sequelize, DataTypes) => {
  return sequelize.define('EventParameter', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        models.EventParameter.belongsTo(models.Event);
      }
    }
  });
};
