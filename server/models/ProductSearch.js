const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductSearch = sequelize.define('ProductSearch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  targetIndustries: {
    type: DataTypes.JSON,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define a model for tracking the relationship between ProductSearch and Prospect
const SearchResult = sequelize.define('SearchResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productSearchId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  prospectId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = { ProductSearch, SearchResult };