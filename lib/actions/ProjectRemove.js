'use strict';

/**
 * Action: ProjectRemove
 * - Removes a project.
 *
 * Options:
 * - stage                (String) the name of the new stage
 */

module.exports = function(SPlugin, serverlessPath) {

  const path   = require('path'),
    SError     = require(path.join(serverlessPath, 'Error')),
    SCli       = require(path.join(serverlessPath, 'utils/cli')),
    fs         = require('fs'),
    BbPromise  = require('bluebird');
  let SUtils;

  BbPromise.promisifyAll(fs);

  /**
   * ProjectRemove Class
   */

  class ProjectRemove extends SPlugin {

    constructor(S, config) {
      super(S, config);
      SUtils = S.utils;
    }

    static getName() {
      return 'serverless.core.' + ProjectRemove.name;
    }

    registerActions() {
      this.S.addAction(this.projectRemove.bind(this), {
        handler:       'projectRemove',
        description:   `Removes a project
usage: serverless project remove`,
        context:       'project',
        contextAction: 'remove',
        options:       [
          {
            option:      'noExeCf',
            shortcut:    'c',
            description: 'Optional - Don\'t execute CloudFormation, just remove it. Default: false'
          }
        ]
      });

      return BbPromise.resolve();
    }

    /**
     * Action
     */

    projectRemove(evt) {
      this.evt    = evt;

      SCli.log(`Removing project...`);
      // Flow
      return this._removeAllStages()
        .then(() => {
          let projectName = this.S.getProject().getName();

          // Status
          SCli.log(`Successfully removed project "${projectName}"`);

          this.evt.data.project = projectName;

          /**
           * Return EVT
           */

          return this.evt;
        });
    }


    /**
     * Remove Stages
     * - Call StageRemove Action for each stage of the project
     */

    _removeAllStages() {
      let stages = this.S.getProject().getAllStages();

      return BbPromise.each(stages, (stage) => {
        let evt = {
          options: {
            stage:   stage.name,
            noExeCf: !!this.evt.options.noExeCf
          }
        };
        return this.S.actions.stageRemove(evt);
      });
    }

  }

  return ProjectRemove;
};
