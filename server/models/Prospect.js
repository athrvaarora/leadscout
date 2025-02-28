const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define Contact model (will be used as a JSON column in Prospect)
const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedInUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prospectId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define Prospect model
const Prospect = sequelize.define('Prospect', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  relevanceScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emailTemplates: {
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

// Define associations
Prospect.hasMany(Contact, { 
  foreignKey: 'prospectId',
  as: 'contacts',
  onDelete: 'CASCADE' 
});

Contact.belongsTo(Prospect, { 
  foreignKey: 'prospectId',
  as: 'prospect'
});

module.exports = { Prospect, Contact };