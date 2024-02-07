'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'basicauthcredentials', // name of Source model
      'interfaceId', // name of the key we're adding 
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'interfaces', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    );

    await queryInterface.addColumn(
      'oauthcredentials', // name of Source model
      'interfaceId', // name of the key we're adding 
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'interfaces', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    );

    await queryInterface.addConstraint('interfaces', {
      fields: ['InterfaceKey'],
      type: 'unique',
      name: 'unique_constraint_InterfaceKey'
    });

  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'basicauthcredentials', // name of Source model
      'interfaceId' // key we want to remove
    );

    await queryInterface.removeColumn(
      'oauthcredentials', // name of Source model
      'interfaceId' // key we want to remove
    );

    await queryInterface.removeConstraint('interfaces', 'unique_constraint_InterfaceKey');

  }
};