'use strict';

/**
 * Action: EnvUnset
 * - Unsets an environment variable based on the provided event
 */

module.exports = function(SPlugin, serverlessPath) {
  const path = require('path'),
      SError  = require(path.join(serverlessPath, 'Error')),
      SCli    = require(path.join(serverlessPath, 'utils/cli')),
      BbPromise  = require('bluebird');
  let SUtils;

  /**
   * EnvUnset Class
   */

  class EnvUnset extends SPlugin {

    /**
     * Constructor
     */

    constructor(S, config) {
      super(S, config);
      SUtils = S.utils;
    }

    /**
     * Define your plugins name
     */

    static getName() {
      return 'serverless.core.' + EnvUnset.name;
    }

    /**
     * Register Actions
     */

    registerActions() {
      this.S.addAction(this.envUnset.bind(this), {
        handler:       'envUnset',
        description:   `unset var value for stage and region. Region can be 'all'
usage: serverless env unset`,
        context:       'env',
        contextAction: 'unset',
        options:       [
          {
            option:      'region',
            shortcut:    'r',
            description: 'region you want to unset env var from'
          },
          {
            option:      'stage',
            shortcut:    's',
            description: 'stage you want to unset env var from'
          },
          {
            option:      'key',
            shortcut:    'k',
            description: 'the key of the env var you want to unset'
          }
        ]
      });
      return BbPromise.resolve();
    }

    /**
     * Action
     */
    envUnset(evt) {

      let _this    = this;
      _this.evt    = evt;

      return _this._prompt()
          .bind(_this)
          .then(_this._validateAndPrepare)
          .then(_this._unsetEnvVar)
          .then(function() {

            SCli.log('Successfully unset env var: ' + _this.evt.options.key);

            /**
             * Return EVT
             */

            return _this.evt;

          });
    }


    /**
     * Prompt key, stage and region
     */
    _prompt() {
      let _this = this;

      return SCli.awsPromptInputEnvKey('Enter env var key to unset its value: ', _this)
          .then(key => {
            _this.evt.options.key = key;
            BbPromise.resolve();
          })
          .then(function(){
            return _this.cliPromptSelectStage('Select a stage to unset env var from: ', _this.evt.options.stage, true)
                .then(stage => {
                  _this.evt.options.stage = stage;
                  BbPromise.resolve();
                })
          })
          .then(function(){
            return _this.cliPromptSelectRegion('Select a region to unset env var from: ', true, true, _this.evt.options.region, _this.evt.options.stage)
                .then(region => {
                  _this.evt.options.region = region;
                  BbPromise.resolve();
                });
          });
    }


    /**
     * Validate all data from event, interactive CLI or non interactive CLI
     * and prepare data
     */

    _validateAndPrepare(){
      let _this = this;

      // non interactive validation
      if (!_this.S.config.interactive) {

        // Check Params
        if (!_this.evt.options.stage || !_this.evt.options.region || !_this.evt.options.key) {
          return BbPromise.reject(new SError('Missing stage and/or region and/or key'));
        }
      }

      // validate stage: make sure stage exists
      if (!_this.S.getProject().validateStageExists(_this.evt.options.stage) && _this.evt.options.stage != 'local') {
        return BbPromise.reject(new SError('Stage ' + _this.evt.options.stage + ' does not exist in your project', SError.errorCodes.UNKNOWN));
      }

      // Skip the next validation if stage is 'local' & region is 'all'
      if (_this.evt.options.stage != 'local' && _this.evt.options.region != 'all') {

        // Validate region: make sure region exists in stage
        if (!_this.S.getProject().validateRegionExists(_this.evt.options.stage, _this.evt.options.region)) {
          return BbPromise.reject(new SError('Region "' + _this.evt.options.region + '" does not exist in stage "' + _this.evt.options.stage + '"'));
        }
      }
    }

    /**
     * unset env var based on data validated
     */
    _unsetEnvVar(){
      let _this = this;

      return SUtils.getEnvFiles(_this.S, _this.evt.options.region, _this.evt.options.stage)
          .then(envMapsByRegion => {
            let putEnvQ = [];

            envMapsByRegion.forEach(mapForRegion => {
              if (!mapForRegion.vars) { //someone could have del the .env file..
                mapForRegion.vars = {};
              }

              delete mapForRegion.vars[_this.evt.options.key];

              let contents = '';
              Object.keys(mapForRegion.vars).forEach(newKey => {
                contents += [newKey, mapForRegion.vars[newKey]].join('=') + '\n';
              });

              if (_this.evt.options.stage == 'local') {
                putEnvQ.push(SUtils.writeFile(_this.S.getProject().getRootPath('.env'), contents));
              } else {
                let project  = _this.S.getProject().getVariables().project,
                  projectBucket   = _this.S.getProject().getVariables().projectBucket,
                  projectBucketRegion = _this.S.getProject().getVariables().projectBucketRegion;

                _this.aws = _this.S.getProvider('aws');

                let params = {
                  Bucket:      projectBucket,
                  Key:         ['serverless', project, _this.evt.options.stage, mapForRegion.region, 'envVars', '.env'].join('/'),
                  ACL:         'private',
                  ContentType: 'text/plain',
                  Body:        contents
                };

                putEnvQ.push(_this.aws.request('S3', 'putObject', params, _this.evt.options.stage, projectBucketRegion));
              }
            });

            return BbPromise.all(putEnvQ);
          });
    }
  }

  return( EnvUnset );
};
