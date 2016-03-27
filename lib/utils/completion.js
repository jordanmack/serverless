'use strict';

/**
 * Serverless: Completion Utilities
 *
 * Utilities used by completion.
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const os = require('os');

// Constants
const _this = this;
const completionCacheFilePath = 'completion/cache.json';
const metaDirectory = '_meta';
const projectFilename = 's-project.json';
const serverlessHomeDirectory = '.serverless';

/**
 * Exported Constants
 */
module.exports.constants = {};
module.exports.constants.completionCacheFilePath = completionCacheFilePath;
module.exports.constants.metaDirectory = metaDirectory;
module.exports.constants.projectFilename = projectFilename;
module.exports.constants.serverlessHomeDirectory = serverlessHomeDirectory;

/**
 * Parse the serverless.commands object to create a completion data object.
 */
module.exports.parseCommandsObject = function(commands)
{
	let data = {};

	// Cycle through each context.
	Object.keys(commands).forEach(function(contextName)
	{
		// Add the context.
		data[contextName] = {};

		// Cycle through each action.
		Object.keys(commands[contextName]).forEach(function(actionName)
		{
			// Add the action.
			data[contextName][actionName] = {};

			// Cycle through each option.
			commands[contextName][actionName]["options"].forEach(function(optionsObject)
			{
				// Add the option.
				data[contextName][actionName]["--" + optionsObject.option] = null;
				// Skip the shortcut since it offers no description.
				// data[contextName][actionName]["-" + optionsObject.shortcut] = null;
			});
		});
	});

	return data;
};

/**
 * Add additional completion data which is not available in the commands object.
 */
module.exports.supplimentCompletionData = function(completionData)
{
	// Add help and debug to the specified object.
	const addOptions = function(object)
	{
		object["--help"] = null;
		object["--debug"] = null;
	}

	// Cycle through each context.
	Object.keys(completionData).forEach(function(context)
	{
		// Cycle though each action.
		Object.keys(completionData[context]).forEach(function(action)
		{
			// Add options at the context.action.option level.
			addOptions(completionData[context][action]);
		});

		// Add options at the context.action level.
		addOptions(completionData[context]);
	});

	// Add options at the context level.
	addOptions(completionData);

	return completionData;
};

/**
 * Add version to completion data.
 */
module.exports.versionCompletionData = function(completionData, version)
{
	let newCompletionData =
	{
		"version": version,
		"data": completionData
	};

	return newCompletionData;
};

/**
 * Determine cache filename.
 */
module.exports.determineCacheFilename = function(projectPath)
{
	// If project path was not set, use home directory, otherwise use project _meta directory.
	if(!projectPath)
		return path.join(os.homedir(), serverlessHomeDirectory, completionCacheFilePath);
	else
		return path.join(projectPath, metaDirectory, completionCacheFilePath);
};

/**
 * Check if a file exists.
 */
module.exports.fileExists = function(filePath)
{
	let exists;

	try
	{
		fs.accessSync(filePath);
		exists = true;
	}
	catch(e)
	{
		exists = false;
	}

	return exists;
}

/**
 * Make directories recursively. (mkdir -p)
 */
module.exports.mkdirp = function(filePath)
{
	const components = filePath.split(path.sep).slice(1);
	let pathCurrent = "/";

	components.forEach(function(value)
	{
		pathCurrent = path.join(pathCurrent, value);

		if(!_this.fileExists(pathCurrent))
			fs.mkdirSync(pathCurrent);
	});
}

/**
 * Write data to file and create directories as necessary.
 */
module.exports.writeFile = function(filePath, data)
{
	try
	{
		_this.mkdirp(path.dirname(filePath));
		fs.writeFileSync(filePath, data);	
	}
	catch(e)
	{
		throw new Error("Unable to write to file: " + filePath);
	}
}

/**
 * Writes the completion cache file to disk.
 */
module.exports.writeCompletionFile = function(completionCacheFilename, completionData)
{
	return _this.writeFile(completionCacheFilename, JSON.stringify(completionData));
};