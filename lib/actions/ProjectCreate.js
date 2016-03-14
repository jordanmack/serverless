'use strict';

/**
 * Action: ProjectCreate
 * - Takes new project data from user and sets a new default "dev" stage
 * - Validates the received data
 * - Generates scaffolding for the new project in CWD
 * - Creates a new project S3 bucket and CF files
 * - Creates CF stack by default, unless noExeCf option is set to true
 * - Generates project JSON files
 *
 * Options:
 * - name                 (String) a name for new project
 * - bucket               (String) The name of your project's bucket (domain url recommended)
 * - profile              (String) an AWS profile to create the project in. Must be available in ~/.aws/credentials
 * - region               (String) the first region for your new project
 * - noExeCf:             (Boolean) Don't execute CloudFormation
 */

let SUtils;

module.exports = function(SPlugin, serverlessPath) {

  const BbPromise  = require('bluebird');

  class ProjectCreate extends SPlugin {

    constructor(S, config) {
      super(S, config);
      SUtils = S.utils;
    }

    static getName() {
      return 'serverless.core.' + ProjectCreate.name;
    }

    registerActions() {
      this.S.addAction(this.createProject.bind(this), {
        handler:       'projectCreate',
        description:   'Creates scaffolding for a new Serverless project',
        context:       'project',
        contextAction: 'create',
        options:       [
          {
            option:      'name',
            shortcut:    'n',
            description: 'A new name for this Serverless project'
          }, {
            option:      'bucket',
            shortcut:    'b',
            description: 'The name of your project\'s bucket (domain url recommended)'
          }, {
            option:      'stage',
            shortcut:    's',
            description: 'Initial project stage'
          }, {
            option:      'region',
            shortcut:    'r',
            description: 'Initial Lambda supported AWS region'
          }, {
            option:      'notificationEmail',
            shortcut:    'e',
            description: 'email to use for AWS alarms'
          }, {
            option:      'profile',
            shortcut:    'p',
            description: 'AWS profile that is set in your aws config file'
          }, {
            option:      'noExeCf',
            shortcut:    'c',
            description: 'Optional - Don\'t execute CloudFormation, just generate it. Default: false'
          }
        ]
      });
      return BbPromise.resolve();
    }

    /**
     * Action
     */

    createProject(evt) {

      return this.S.actions.projectInit({
        options: {
          name:              evt.options.name,
          bucket:            evt.options.bucket,
          stage:             evt.options.stage,
          region:            evt.options.region,
          profile:           evt.options.profile,
          noExeCf:           evt.options.noExeCf ? true : false
        }
      });
    }
  }

  return( ProjectCreate );
};