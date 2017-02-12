module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PageView', {
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
        models.PageView.belongsTo(models.App);
      }
    }
  });
};
