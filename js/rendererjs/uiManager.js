'use strict';

// Imported Electron modules
const Electron = require('electron');
const mainWindow = Electron.remote.getCurrentWindow();
// Imported Node modules
const Path = require('path');
const Fs = require('fs');
// Imported Other modules
const Siad = require('sia.js');
const $ = require('jquery');

// Clicking the logo links to sia.tech
$('.logo-container').click(function() {
	Electron.shell.openExternal('http://sia.tech');
});

/**
 * @class UIManager
 */
module.exports = (function UIManager() {
	// Variable to track error log
	var errorLog;
	// Shows tooltip with content on given element
	var tooltipTimeout, tooltipVisible;
	// Notification system
	var notification = require('./notificationManager.js');

	/**
	 * Shows notification in lower right of UI window
	 * @function UIManager#notify
	 * @param {string} message What to display in notification
	 * @param {string} type The form of notification
	 * @param {function} clickAction The function to call upon the user
	 * clicking the notification
	 * TODO: separate out notification management from this file
	 */
	function notify(message, type, clickAction) {
		// Record errors for reference in `errors.log`
		if (type === 'error') {
			if (!errorLog) {
				errorLog = Fs.createWriteStream(Path.join(__dirname, '../..', 'errors.log'));
			}
			try {
				errorLog.write(message + '\n');
			} catch (e) {
				errorLog.write(e.toString() + '\n');
			}
		}
		notification(message, type, clickAction);
	}

	/**
	 * Shows tooltip with content at given offset location
	 * @function UIManager#tooltip
	 * @param {string} content The message to display in tooltip
	 * @param {Object} offset The dimensions of the element to display over
	 * TODO: separate out tooltip management from this file
	 */
	function tooltip(content, offset) {
		var eTooltip = $('#tooltip');
		offset = offset || {
			top: 0,
			left: 0,
		};

		// Show the tooltip at the proper location
		eTooltip.show();
		eTooltip.html(content);
		var middleX = offset.left - (eTooltip.width()/2) + (offset.width/2);
		var topY = offset.top - (eTooltip.height()) - (offset.height/2);
		eTooltip.offset({
			top: topY,
			left: middleX,
		});

		// Fade the toolip from 0 to 1
		if (!tooltipVisible) {
			eTooltip.stop();
			eTooltip.css({'opacity':0});
			tooltipVisible = true;
			eTooltip.animate({
				'opacity':1
			}, 400);
		} else {
			eTooltip.stop();
			eTooltip.show();
			eTooltip.css({'opacity':1});
		}

		// Hide the tooltip after 1.4 seconds
		clearTimeout(tooltipTimeout);
		tooltipTimeout = setTimeout(function() {
			// eTooltip.hide();
			eTooltip.animate({
				'opacity':'0'
			}, 400, function() {
				tooltipVisible = false;
				eTooltip.hide();
			});
		}, 1400);
	}

	// Checks if there is an update available
	function checkUpdate() {
		$.ajax({
			url: 'https://api.github.com/repos/NebulousLabs/Sia-UI/releases',
			type: 'GET',
			success: function(responseData, textStatus, jqXHR) {
				// If version matches latest release version, do nothing
				if (responseData[0].tag_name === require('../../package.json').version) {
					return;
				}

				// If not, provide links to UI release page
				var updatePage = function() {
					Electron.shell.openExternal('https://github.com/NebulousLabs/Sia-UI/releases');
				};
				$('#update-ui').show().click(updatePage);
				notify('Update available for UI', 'update', updatePage);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// jqXHR is the XmlHttpRequest that jquery returns back on error
				var errCode = textStatus + ' ' + jqXHR.status + ' ' + errorThrown + ' ' + jqXHR.responseText;
				notify('Update check failed: ' + errCode, 'error');
			},
		});
	}

	/**
	* Called at window.onready, initalizes the UI
	* @function UIManager#init
	*/
	function init() {
		checkUpdate();
	}

	/**
	* Called at window.beforeunload, closes the UI
	* @function UIManager#kill
	*/
	function kill(ev) {
		// Close the error write stream
		if (errorLog) {
			errorLog.end();
		}
	}

	return {
		init: init,
		kill: kill,
		tooltip: tooltip,
		notify: notify,
	};
})();