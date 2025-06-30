/**
 * @name Auto_Fake_Mute_&_Deafen_By_Dr.FarFar
 * @author Dr.FarFar
 * @version 1.0.0.0
 * @description Automatically Fake Mute And Deafen Yourself. Just Mute/Deafen After Joining Voice Channels Before Service Activation, And After Service Activation, Undeafen To Listen And Unmute To Speak!
 * @invite https://discord.gg/J2Hx3eu4RJ
 * @website https://www.Dr-FarFar.com
 * @donate https://ko-fi.com/drfarfar
 * @patreon https://patreon.com/3XS0
 * @source https://raw.githubusercontent.com/BlackHatLab-INC/Better-Discord-Plugins/Auto-Fake-Mute-&-Deafen/AutoFakeMute&Deafen.plugin.js
 * @updateUrl https://raw.githubusercontent.com/BlackHatLab-INC/Better-Discord-Plugins/Auto-Fake-Mute-&-Deafen/AutoFakeMute&Deafen.plugin.js
 */

// This section provides a compatibility shim for Windows Script Host (WSH) users who accidentally try to run this file directly.
// It offers to copy the plugin to the BetterDiscord plugins folder and explains that this file is meant to be used as a BetterDiscord plugin, not run directly.

/*@cc_on
@if (@_jscript)
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("I am a BetterDiscord plugin Developed By Dr.FarFar. \nIt looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a BetterDiscord plugin Developed By Dr.FarFar", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();
@else@*/

// ==============================================
//        CONSTANTS AND CONFIGURATION
// ==============================================

const CHANGES = {
	"1.0.0.0": {
		fixed: [
			"Fixed the issue where the fake mute feature was not working",
			"Fixed the freezing issue of the service start/stop icon",
		],
        added: [
			"Added changelog system to show updates to users",
			"Added automatic changelog display on plugin update",
		],
		improved: [
			"Improved user experience with better feedback",
			"Enhanced plugin stability and performance",
		],
	},
};

// ==============================================
//        UTILITY FUNCTIONS
// ==============================================

const createStyledElement = (tag, styles) => {
	const element = document.createElement(tag);
	if (styles) {
		element.style.cssText = styles;
	}
	return element;
};

const createRainbowText = (text, colors) => {
	const sanitizedText = text.replace(/[<>]/g, '');
	const sanitizedColors = colors.replace(/[<>]/g, '');
	
	return `<span style="
		background: linear-gradient(45deg, ${sanitizedColors});
		background-size: 400% 400%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: rainbowWave 3s ease-in-out infinite;
		font-weight: bold;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
	">${sanitizedText}</span>
	<style>
		@keyframes rainbowWave {
			0% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
			100% { background-position: 0% 50%; }
		}
	</style>`;
};

const safeAppendChild = (parent, child) => {
	try {
		if (parent && child && parent.appendChild) {
			parent.appendChild(child);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error appending child:', error);
		return false;
	}
};

const safeRemoveChild = (parent, child) => {
	try {
		if (parent && child && parent.removeChild) {
			parent.removeChild(child);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error removing child:', error);
		return false;
	}
};

// ==============================================
//        MAIN PLUGIN CLASS
// ==============================================

module.exports = class AutoFakeMuteDeafen {
    
    // ==========================================
    //        CONSTRUCTOR AND BASIC METHODS
    // ==========================================
    
    constructor() {
        this.isEnabled = false;
        this.meta = {
            name: "Auto Fake Mute & Deafen",
            version: "1.0.0.0"
        };
        this.tooltip = null;
        this.tooltipTimeout = null;
        this.observer = null;
        this.originalWebSocketSend = null;
    }

    getName() { 
        return "Auto Fake Mute & Deafen"; 
    }
    
    getDescription() { 
        return "Automatically Fake Mute And Deafen Yourself. Just Mute/Deafen After Joining Voice Channels Before Service Activation, And After Service Activation, Undeafen To Listen And Unmute To Speak!"; 
    }
    
    getVersion() { 
        return "1.0.0.0"; 
    }
    
    getAuthor() { 
        return "Dr.FarFar"; 
    }
    
    // ==========================================
    //        PLUGIN LIFECYCLE METHODS
    // ==========================================
    
    start() {
        try {
            setTimeout(() => this.addButton(), 1000);
            this.observeForButton();
            this.showChangelog();
            this.ensureDiscordServerJoin();
        } catch (error) {
            console.error('Error starting plugin:', error);
        }
    }

    stop() {
        try {
            if (this.isEnabled) {
                this.disableService();
            }

            const button = document.querySelector('[aria-label="BlackHatLab"]');
            if (button && button.parentNode) {
                safeRemoveChild(button.parentNode, button);
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            if (this.tooltip && this.tooltip.parentNode) {
                safeRemoveChild(this.tooltip.parentNode, this.tooltip);
                this.tooltip = null;
            }

            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }

            const customStyle = document.querySelector('#blackhatlab-pulse-style');
            if (customStyle && customStyle.parentNode) {
                safeRemoveChild(customStyle.parentNode, customStyle);
            }
        } catch (error) {
            console.error('Error stopping plugin:', error);
        }
    }

    // ==========================================
    //        SERVICE CONTROL METHODS
    // ==========================================
    
    toggleService() {
        try {
            this.isEnabled ? this.disableService() : this.enableService();
        } catch (error) {
            console.error('Error toggling service:', error);
        }
    }

    enableService() {
        try {
            const text = new TextDecoder("utf-8");
            
            if (!this.originalWebSocketSend) {
                this.originalWebSocketSend = WebSocket.prototype.send;
            }
            
            WebSocket.prototype.send = (data) => {
                try {
                    if (Object.prototype.toString.call(data) === "[object ArrayBuffer]") {
                        const decoded = text.decode(data);
                        if (decoded.includes("self_deaf") || decoded.includes("self_mute")) {
                            const modifiedData = decoded
                                .replace('"self_mute":false', '"self_mute":true')
                                .replace('"self_deaf":false', '"self_deaf":true');
                            
                            const encoder = new TextEncoder();
                            const newBuffer = encoder.encode(modifiedData);
                            this.originalWebSocketSend.call(this, newBuffer);
                            return;
                        }
                    }
                    this.originalWebSocketSend.call(this, data);
                } catch (error) {
                    console.error('Error in WebSocket send override:', error);
                    this.originalWebSocketSend.call(this, data);
                }
            };
            
            this.isEnabled = true;
            BdApi.showToast("Service Activated!", {type: "success"});
        } catch (error) {
            console.error('Error enabling service:', error);
            BdApi.showToast("Failed to activate service", {type: "error"});
        }
    }

    disableService() {
        try {
            if (this.originalWebSocketSend) {
                WebSocket.prototype.send = this.originalWebSocketSend;
                this.originalWebSocketSend = null;
            }
            this.isEnabled = false;
            BdApi.showToast("Service Deactivated", {type: "danger"});
        } catch (error) {
            console.error('Error disabling service:', error);
            BdApi.showToast("Failed to deactivate service", {type: "error"});
        }
    }

    // ==========================================
    //        UI BUTTON METHODS
    // ==========================================
    
    observeForButton() {
        try {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        const muteButton = document.querySelector('[aria-label="Mute"]');
                        const existingButton = document.querySelector('[aria-label="BlackHatLab"]');
                        
                        if (muteButton && !existingButton) {
                            this.addButton();
                        }
                    }
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            this.observer = observer;
        } catch (error) {
            console.error('Error setting up observer:', error);
        }
    }

    addButton() {
        try {
            const existingButton = document.querySelector('[aria-label="BlackHatLab"]');
            if (existingButton) return;
            
            const userSettingsButton = document.querySelector('[aria-label="Mute"]');
            if (!userSettingsButton) return;

            const button = document.createElement('button');
            button.className = userSettingsButton.className;
            button.setAttribute('aria-label', 'BlackHatLab');
            button.style.marginRight = '10px';
            
            button.setAttribute('data-tooltip', 'Auto Fake Mute & Deafen [ Developed By Dr.FarFar ]');
            button.setAttribute('data-tooltip-position', 'top');
            
            const icon = createStyledElement('div', `
                border-radius: 25%;
                padding: 5px;
                border: 4px solid transparent;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                animation: pulse 2s infinite;
            `);
            icon.className = 'icon-2xnN2Y';
            icon.innerHTML = '<img src="data:image/png;base64,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0p8zAAA4YGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMjEgNzkuMTU0OTExLCAyMDEzLzEwLzI5LTExOjQ3OjE2ICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDEzLTEyLTA1VDE0OjU2OjMzKzAyOjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTUtMDUtMTFUMDg6MjM6MjkrMDI6MDA8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wOk1ldGFkYXRhRGF0ZT4yMDE1LTA1LTExVDA4OjIzOjI5KzAyOjAwPC94bXA6TWV0YWRhdGFEYXRlPgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOjE5MDk4ZWE1LTBiMWYtM2E0YS05MTg2LWEzZWE1ZTVjODNiYzwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+eG1wLmRpZDoxOTA5OGVhNS0wYjFmLTNhNGEtOTE4Ni1hM2VhNWU1YzgzYmM8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDoxOTA5OGVhNS0wYjFmLTNhNGEtOTE4Ni1hM2VhNWU1YzgzYmM8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6MTkwOThlYTUtMGIxZi0zYTRhLTkxODYtYTNlYTVlNWM4M2JjPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDEzLTEyLTA1VDE0OjU2OjMzKzAyOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjI2OTwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4zMDQ8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAg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" width="24" height="24" style="object-fit: contain;">';
            
            if (!document.querySelector('#blackhatlab-pulse-style')) {
                const style = createStyledElement('style', '');
                style.id = 'blackhatlab-pulse-style';
                style.textContent = `
                    @keyframes pulse {
                        0%   { transform: scale(1.1) rotate(2deg);    box-shadow: 0 0 1.25px #ff00ff, 0 0 2.5px #00ffff, 0 0 3.75px #fffb00; }
                        15%  { transform: scale(1.08) rotate(-3deg);  box-shadow: 0 0 1.875px #00ffea, 0 0 3.125px #ff00c8, 0 0 4.375px #00ff00; }
                        30%  { transform: scale(1.12) rotate(5deg);   box-shadow: 0 0 2.5px #ff8800, 0 0 3.75px #00ff88, 0 0 5px #ff0088; }
                        50%  { transform: scale(1.15) rotate(-6deg);  box-shadow: 0 0 3.125px #00ff00, 0 0 4.375px #ff0000, 0 0 5.625px #0000ff; }
                        70%  { transform: scale(1.09) rotate(4deg);   box-shadow: 0 0 3.75px #ff00ff, 0 0 5px #00ffff, 0 0 6.25px #fffb00; }
                        85%  { transform: scale(1.13) rotate(-2deg);  box-shadow: 0 0 4.375px #00ffea, 0 0 5.625px #ff00c8, 0 0 6.875px #00ff00; }
                        100% { transform: scale(1.1) rotate(2deg);    box-shadow: 0 0 1.25px #ff00ff, 0 0 2.5px #00ffff, 0 0 3.75px #fffb00; }
                    }
                `;
                safeAppendChild(document.head, style);
            }
            
            button.appendChild(icon);

            button.addEventListener('mouseenter', () => {
                this.tooltipTimeout = setTimeout(() => {
                    this.tooltip = createStyledElement('div', `
                        position: absolute;
                        background: #1e1f22;
                        color: #dcddde;
                        padding: 6px 8px;
                        border-radius: 4px;
                        font-size: 13px;
                        white-space: nowrap;
                        z-index: 10000;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                        pointer-events: none;
                        opacity: 0;
                        transition: opacity 0.15s ease;
                        font-family: 'Cairo', 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        line-height: 1.2;
                        font-weight: bold;
                    `);

                    this.tooltip.innerHTML = this.createTooltipContent(button.getAttribute('data-tooltip'));
                    safeAppendChild(document.body, this.tooltip);
                    
                    const rect = button.getBoundingClientRect();
                    this.tooltip.style.left = `${rect.left + (rect.width / 2) - (this.tooltip.offsetWidth / 2)}px`;
                    this.tooltip.style.top = `${rect.top - this.tooltip.offsetHeight - 8}px`;

                    setTimeout(() => {
                        if (this.tooltip) this.tooltip.style.opacity = '1';
                    }, 10);
                }, 500);
            });
            
            button.addEventListener('mouseleave', () => {
                if (this.tooltipTimeout) {
                    clearTimeout(this.tooltipTimeout);
                    this.tooltipTimeout = null;
                }
                if (this.tooltip) {
                    this.tooltip.style.opacity = '0';
                    setTimeout(() => {
                        if (this.tooltip && this.tooltip.parentNode) {
                            safeRemoveChild(this.tooltip.parentNode, this.tooltip);
                        }
                        this.tooltip = null;
                    }, 200);
                }
            });
            
            button.addEventListener('click', () => {
                this.toggleService();
                const newTooltipText = this.isEnabled ? 'Auto Fake Mute & Deafen [ Deactivate ]' : 'Auto Fake Mute & Deafen [ Activate ]';
                button.setAttribute('data-tooltip', newTooltipText);
                
                if (this.tooltip) {
                    this.tooltip.innerHTML = this.createTooltipContent(newTooltipText);
                }
                
                icon.style.transform = 'scale(0.8)';
                icon.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
                setTimeout(() => {
                    icon.style.transform = 'scale(1)';
                    icon.style.border = `4px solid ${this.isEnabled ? 'rgb(0, 255, 140)' : 'rgb(255, 0, 4)'}`;
                    icon.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
                }, 150);
            });

            if (userSettingsButton.parentNode) {
                userSettingsButton.parentNode.insertBefore(button, userSettingsButton);
            }
        } catch (error) {
            console.error('Error adding button:', error);
        }
    }

    createTooltipContent(tooltipText) {
        try {
            const isActivate = tooltipText.includes('Activate');
            const statusText = isActivate ? 'Activate' : 'Deactivate';
            const statusColors = isActivate ? '#43b581,rgb(0, 255, 64),rgb(0, 0, 0),rgb(171, 240, 59)' : '#ed4245,rgb(255, 0, 0),rgb(0, 0, 0),rgb(243, 87, 222)';
            const rainbowColors = '#ff0000, #00ff00, #0000ff, #ffff00, #ff00ff, #00ffff, #ff8800, #8800ff, #00ff88, #ff0088, #880000, #008800, #000088, #888888';

            return tooltipText
                .replace(statusText, createRainbowText(statusText, statusColors))
                .replace('Developed By Dr.FarFar', createRainbowText('Developed By Dr.FarFar', rainbowColors))
                .replace('Auto Fake Mute & Deafen [ ', `
                    <div style="text-align: center; line-height: 1.4;">
                        <div>Auto Fake Mute & Deafen</div>
                        <div>[ `)
                .replace(' ]', ` ]</div></div>`);
        } catch (error) {
            console.error('Error creating tooltip content:', error);
            return tooltipText;
        }
    }

    ensureButtonExists() {
        try {
            const existingButton = document.querySelector('[aria-label="BlackHatLab"]');
            if (!existingButton) {
                this.addButton();
            }
        } catch (error) {
            console.error('Error ensuring button exists:', error);
        }
    }

    // ==========================================
    //        CHANGELOG METHODS
    // ==========================================
    
    showChangelog() {
        try {
            const { Data: Data2 } = new BdApi("AutoFakeMuteDeafen");
            const lastVersion = Data2.load("lastVersion");
            
            if (!lastVersion || !(lastVersion in CHANGES)) {
                Data2.save("lastVersion", this.meta.version);
                return;
            }

            const titles = {
                fixed: "Fixes",
                added: "Features",
                progress: "Progress",
                improved: "Improvements",
            };

            const changes = [];
            for (const [version, changelog] of Object.entries(CHANGES)) {
                if (lastVersion === version) break;
                for (const [type, messages] of Object.entries(changelog)) {
                    let change = changes.find((x) => x.type === type);
                    if (!change) {
                        change = { title: titles[type] || type, type, items: [] };
                        changes.push(change);
                    }
                    change.items.push(...messages);
                }
            }

            if (changes.length === 0) return;
            
            this.showChangelogModal({
                title: this.meta.name,
                subtitle: "Version " + this.meta.version,
                blurb: `Here's what's been changed since version ${lastVersion}.`,
                changes,
            });
            Data2.save("lastVersion", this.meta.version);
        } catch (error) {
            console.error('Error showing changelog:', error);
        }
    }

    showChangelogModal({ title, subtitle, blurb, changes }) {
        try {
            const modal = createStyledElement('div', `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            `);

            const content = createStyledElement('div', `
                background: #36393f;
                border-radius: 8px;
                padding: 20px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                color: #dcddde;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            `);

            const header = createStyledElement('div', `
                border-bottom: 1px solid #4f545c;
                padding-bottom: 15px;
                margin-bottom: 20px;
            `);

            const titleEl = createStyledElement('h2', `
                margin: 0 0 5px 0;
                color: #fff;
                font-size: 20px;
            `);
            titleEl.textContent = title;

            const subtitleEl = createStyledElement('p', `
                margin: 0 0 10px 0;
                color: #72767d;
                font-size: 14px;
            `);
            subtitleEl.textContent = subtitle;

            const blurbEl = createStyledElement('p', `
                margin: 0;
                color: #dcddde;
                font-size: 14px;
                line-height: 1.4;
            `);
            blurbEl.textContent = blurb;

            header.appendChild(titleEl);
            header.appendChild(subtitleEl);
            header.appendChild(blurbEl);

            const changesContainer = createStyledElement('div', 'margin-bottom: 20px;');

            changes.forEach(change => {
                const changeSection = createStyledElement('div', 'margin-bottom: 15px;');

                const changeTitle = createStyledElement('h3', `
                    margin: 0 0 10px 0;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                `);
                changeTitle.textContent = change.title;

                const changeList = createStyledElement('ul', `
                    margin: 0;
                    padding-left: 20px;
                    color: #dcddde;
                    font-size: 14px;
                    line-height: 1.4;
                `);

                change.items.forEach(item => {
                    const listItem = createStyledElement('li', 'margin-bottom: 5px;');
                    listItem.textContent = item;
                    changeList.appendChild(listItem);
                });

                changeSection.appendChild(changeTitle);
                changeSection.appendChild(changeList);
                changesContainer.appendChild(changeSection);
            });

            const closeButton = createStyledElement('button', `
                background: #5865f2;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background 0.2s;
            `);
            closeButton.textContent = 'Close';
            
            const closeModal = () => {
                if (modal && modal.parentNode) {
                    safeRemoveChild(document.body, modal);
                }
            };
            
            closeButton.addEventListener('mouseenter', () => closeButton.style.background = '#4752c4');
            closeButton.addEventListener('mouseleave', () => closeButton.style.background = '#5865f2');
            closeButton.addEventListener('click', closeModal);

            content.appendChild(header);
            content.appendChild(changesContainer);
            content.appendChild(closeButton);
            modal.appendChild(content);
            safeAppendChild(document.body, modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        } catch (error) {
            console.error('Error showing changelog modal:', error);
        }
    }

    // ==========================================
    //        DISCORD SERVER JOIN METHODS
    // ==========================================
    
    ensureDiscordServerJoin() {
        try {
            const { Data: Data2 } = new BdApi("AutoFakeMuteDeafen");
            const Prompt_Interval = 30 * 24 * 60 * 60 * 1000;
            const inviteUrl = 'https://discord.gg/J2Hx3eu4RJ';
            const lastPrompted = Data2.load("lastPromptedTime");
            const currentTime = Date.now();

            if (!lastPrompted || (currentTime - lastPrompted) >= Prompt_Interval) {
                this.showJoinServerModal(inviteUrl);
                Data2.save("lastPromptedTime", currentTime);
            }
        } catch (error) {
            console.error('Error Ensuring Discord Server Join:', error);
        }
    }

    showJoinServerModal(inviteUrl) {
        try {
            if (!document.querySelector('#cairo-font-link')) {
                const fontLink = createStyledElement('link', '');
                fontLink.id = 'cairo-font-link';
                fontLink.rel = 'stylesheet';
                fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap';
                safeAppendChild(document.head, fontLink);
            }

            const modal = createStyledElement('div', `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Cairo', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                animation: fadeIn 0.3s ease;
            `);

            const content = createStyledElement('div', `
                background: #36393f;
                border-radius: 12px;
                padding: 30px;
                max-width: 450px;
                color: #dcddde;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                text-align: center;
                animation: slideIn 0.3s ease;
                border: 1px solid #4f545c;
                font-family: 'Cairo', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            `);

            const title = createStyledElement('h2', `
                margin: 0 0 15px 0;
                color: #fff;
                font-size: 22px;
                font-weight: 700;
                font-family: 'Cairo', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            `);
            title.innerHTML = createRainbowText('Join Our Community!', '#ff0000, #00ff00, #0000ff, #ffff00, #ff00ff, #00ffff, #ff8800, #8800ff, #00ff88, #ff0088, #880000, #008800, #000088, #888888');

            const message = createStyledElement('p', `
                margin: 0 0 25px 0;
                color: #dcddde;
                font-size: 15px;
                line-height: 1.5;
                font-family: 'Cairo', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            `);
            message.textContent = 'Join Our Discord Server To Get The Latest Updates, Support, And Exclusive Features For This Plugin!';

            const benefitsList = createStyledElement('div', `
                margin: 0 0 25px 0;
                text-align: left;
                background: #2f3136;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #5865f2;
                font-family: 'Cairo', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            `);

            const benefits = [
                '✨ Latest Plugin Updates And Features',
                '🛠️ Technical Support And Troubleshooting',
                '💡 Tips And Tricks For Better Usage',
                '🎮 Community Discussions And Feedback',
                '.',
                'Free And Exclusive For Server Boosts Only',
                '💻 Premium Digital Marketing Tools',
                '🛡️ Premium Cyber Security Tools',
                '🔒 Lifetime Access To All Premium Tools'
            ];

            benefits.forEach(benefit => {
                const benefitItem = createStyledElement('div', `
                    margin: 0 0 8px 0;
                    color: #dcddde;
                    font-size: 16px;
                    line-height: 1.4;
                    font-family: 'Cairo', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-weight: bold;
                `);
                benefitItem.textContent = benefit;
                benefitsList.appendChild(benefitItem);
            });

            const buttonContainer = createStyledElement('div', `
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            `);

            const joinButton = createStyledElement('button', `
                background: linear-gradient(135deg, #4ecdc4 0%, #7289da 20%, #a3cef1 40%, #b8e994 60%, #feca57 80%, #5865f2 100%);
                background-size: 200% 200%;
                color: white;
                border: none;
                padding: 15px 32px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 18px;
                font-weight: 700;
                font-family: 'Cairo', 'Segoe UI', Arial, sans-serif;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 
                    0 4px 15px rgba(88, 101, 242, 0.3),
                    0 8px 25px rgba(88, 101, 242, 0.2),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                    0 1px 0 rgba(255, 255, 255, 0.2) inset;
                width: 100%;
                max-width: 400px;
                min-width: 120px;
                position: relative;
                overflow: hidden;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                letter-spacing: 0.5px;
                animation: buttonGlow 3s ease-in-out infinite;
            `);
            joinButton.innerHTML = createRainbowText('Join Our Server', '#ff6b6b, #4ecdc4, #45b7d1, #96ceb4,rgb(0, 0, 0), #ff9ff3, #54a0ff, #5f27cd,rgb(0, 0, 0), #ff9f43, #10ac84, #ee5a24, #0abde3, #ff3838');
            
            const shimmerOverlay = createStyledElement('div', `
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.6s ease;
                pointer-events: none;
                z-index: 1;
            `);
            joinButton.appendChild(shimmerOverlay);
            
            const innerGlow = createStyledElement('div', `
                position: absolute;
                top: 2px;
                left: 2px;
                right: 2px;
                bottom: 2px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
                border-radius: 10px;
                pointer-events: none;
                z-index: 0;
            `);
            joinButton.insertBefore(innerGlow, joinButton.firstChild);
            
            const closeModal = () => {
                if (modal && modal.parentNode) {
                    modal.style.animation = 'fadeOut 0.3s ease';
                    content.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (modal && modal.parentNode) {
                            safeRemoveChild(document.body, modal);
                        }
                    }, 300);
                }
            };
            
            joinButton.addEventListener('mouseenter', () => {
                joinButton.style.transform = 'translateY(-3px) scale(1.02)';
                joinButton.style.boxShadow = `
                    0 8px 25px rgba(88, 101, 242, 0.4),
                    0 12px 35px rgba(88, 101, 242, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
                    0 1px 0 rgba(255, 255, 255, 0.3) inset
                `;
                joinButton.style.backgroundPosition = '100% 100%';
                shimmerOverlay.style.left = '100%';
            });
            joinButton.addEventListener('mouseleave', () => {
                joinButton.style.transform = 'translateY(0) scale(1)';
                joinButton.style.boxShadow = `
                    0 4px 15px rgba(88, 101, 242, 0.3),
                    0 8px 25px rgba(88, 101, 242, 0.2),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                    0 1px 0 rgba(255, 255, 255, 0.2) inset
                `;
                joinButton.style.backgroundPosition = '0% 0%';
                shimmerOverlay.style.left = '-100%';
            });
            
            joinButton.addEventListener('mousedown', () => {
                joinButton.style.transform = 'translateY(-1px) scale(0.98)';
                joinButton.style.boxShadow = `
                    0 2px 8px rgba(88, 101, 242, 0.4),
                    0 4px 15px rgba(88, 101, 242, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                    0 1px 0 rgba(255, 255, 255, 0.1) inset
                `;
            });
            joinButton.addEventListener('mouseup', () => {
                joinButton.style.transform = 'translateY(-3px) scale(1.02)';
                joinButton.style.boxShadow = `
                    0 8px 25px rgba(88, 101, 242, 0.4),
                    0 12px 35px rgba(88, 101, 242, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
                    0 1px 0 rgba(255, 255, 255, 0.3) inset
                `;
            });
            
            joinButton.addEventListener('click', () => {
                window.open(inviteUrl, '_blank');
                closeModal();
            });

            if (!document.querySelector('#server-modal-animations')) {
                const style = createStyledElement('style', '');
                style.id = 'server-modal-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    @keyframes slideIn {
                        from { transform: translateY(-20px) scale(0.95); opacity: 0; }
                        to { transform: translateY(0) scale(1); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateY(0) scale(1); opacity: 1; }
                        to { transform: translateY(-20px) scale(0.95); opacity: 0; }
                    }
                    @keyframes buttonGlow {
                        0%, 100% { 
                            box-shadow: 
                                0 4px 15px rgba(88, 101, 242, 0.3),
                                0 8px 25px rgba(88, 101, 242, 0.2),
                                0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                                0 1px 0 rgba(255, 255, 255, 0.2) inset;
                        }
                        50% { 
                            box-shadow: 
                                0 4px 20px rgba(88, 101, 242, 0.4),
                                0 8px 30px rgba(88, 101, 242, 0.3),
                                0 0 0 1px rgba(255, 255, 255, 0.15) inset,
                                0 1px 0 rgba(255, 255, 255, 0.25) inset;
                        }
                    }
                `;
                safeAppendChild(document.head, style);
            }

            buttonContainer.appendChild(joinButton);

            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(benefitsList);
            content.appendChild(buttonContainer);
            modal.appendChild(content);
            safeAppendChild(document.body, modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        } catch (error) {
            console.error('Error showing join server modal:', error);
        }
    }
};
