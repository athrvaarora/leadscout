const { sequelize } = require('../config/database');
const User = require('./User');
const { Prospect, Contact } = require('./Prospect');
const { ProductSearch, SearchResult } = require('./ProductSearch');

// Define associations
User.hasMany(ProductSearch, {
  foreignKey: 'userId',
  as: 'productSearches'
});

ProductSearch.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Prospect, {
  foreignKey: 'userId',
  as: 'prospects'
});

Prospect.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

ProductSearch.belongsToMany(Prospect, {
  through: SearchResult,
  foreignKey: 'productSearchId',
  otherKey: 'prospectId',
  as: 'prospects'
});

Prospect.belongsToMany(ProductSearch, {
  through: SearchResult,
  foreignKey: 'prospectId',
  otherKey: 'productSearchId',
  as: 'searches'
});

// Function to sync all models with the database
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    return true;
  } catch (error) {
    console.error('Error syncing models with database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Prospect,
  Contact,
  ProductSearch,
  SearchResult,
  syncModels
};