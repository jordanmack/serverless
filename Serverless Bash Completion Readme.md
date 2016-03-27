Serverless Bash Tab Completion
===

## Install Serverless

### Install the Serverless fork with bash completion support.
`npm i -g https://github.com/jordanmack/serverless.git#feature-bash-completion`

## Install Bash Completion

**RESTART YOUR SHELL AFTER INSTALLING!**  

### Install bash completion for current user only (OS X).
`Serverless-completion _installLocal >> ~/.bash_profile`

### Install bash completion for current user only (Ubuntu Linux).
`Serverless-completion _installLocal >> ~/.bashrc`

### Install bash completion for all users (Ubuntu Linux).
`sudo bash -c "Serverless-completion _installGlobal > /etc/bash_completion.d/serverless"`

### Make no changes and install temporarily in the current shell only (Ubuntu Linux).
`source <(Serverless-completion _installLocal)`

## Notes
* The main completion handler is named `Serverless-completion`, with a capital `S`. This is intentional, so it does not compete with the other Serverless commands for tab completion. The only time this command is every used directly is for installation.
* The completions cache file location is dependent on if the user is within a Serverless project:
 * If within a Serverless project, the cache file is set to `_meta/completion/cache.json`.
 * If not in a Serverless project, the cache file is set to `~/.serverless/completion/cache.json`.
* `Serverless-completion` uses the Serverless class to generate a cache file:
 * When the `serverless` executable is run.
 * When tab completion is used, and a cache file does not exist.
 * When the Serverless framework has been updated to a new version.
* When using a cache file, the Serverless framework is not used. Benchmarks show that omitting the framework results in a speed increase of approximately 1000%.
* Since `slss` is a possible completion of `sls`, the user must type a space after `sls` before tab completion can be used.
* In addition to the context and action, options can also be completed. To view the option completions, you must first type `--`, then hit tab a couple times. This matches the functionality for tab completion by several major vendors.
* Tab completion for shortcuts (single -) was omitted. The shortcuts without any accompanying descriptions may lead to incorrectly guessing and running the wrong option.
* Only the bash shell on Linux and OS X are supported. Windows is not currently supported.