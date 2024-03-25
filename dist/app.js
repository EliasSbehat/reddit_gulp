/* global
 $,
 $$,
 El,
 Anim,
 Footer,
 Header,
 Store,
 Menu,
 Modal,
 Posts,
 Comments,
 is,
 wideScreenBP,
 largeScreenBP
 */

"use strict";

var UI = (function () {

	var Move = {
		LEFT: 1,
		RIGHT: 2
	};

	var View = {
		MAIN: 1,
		COMMENTS: 2
	};

	var classes = { // css
		showView: "show-view",
		showMenu: "show-menu",
		mnml: "mnml",
		hide: "hide",
		swipe: 'from-swipe',
		invisible: 'invisible'
	};

	var keyCode = {
		MENU: 49, // 1
		MAIN: 50, // 2
		DETAIL: 51 // 3
	};

	var template = {
		loader: "<div class='loader'></div>",
		closeModalButton: "<a href='#close' class='close-form no-ndrln txt-cntr txt-bld'>&times;</a>",
		closeThreadButton: "<a href='#close' class='close-thread no-ndrln txt-cntr txt-bld' style='margin-top:38px;'>&times;</a>"
	};

	var el = {
		body: $('body'),
		mainWrap: $('#main-wrap'),
		detailWrap: $('#detail-wrap'),
		mainView: $('.main-view'),
		detailView: $('.detail-view')
	};

	var currentView = View.MAIN;

	var getCurrentView = function getCurrentView() {
		return currentView;
	};

	var setCurrentView = function setCurrentView(view) {
		currentView = view;
	};

	var setSubTitle = function setSubTitle(title) {
		Header.el.subtitleText.text(title);
		Footer.el.subTitle.text(title);
	};

	var backToMainView = function backToMainView() {
		Header.el.btnNavBack.addClass(classes.invisible);
		Header.el.subtitle.removeClass(classes.invisible);
		Header.el.centerSection.empty().append(Header.el.icon);
		Anim.slideFromLeft();
	};

	var switchDisplay = function switchDisplay(el, visible) {
		if (visible) {
			el.classList.add(classes.hide);
		} else {
			el.classList.remove(classes.hide);
		}
	};

	var addLoader = function addLoader(elem) {
		var loader = $("<div/>").addClass("loader");
		elem.append(loader);
		return loader;
	};

	var scrollFixLinks = function scrollFixLinks() {
		// Make links section always scrollable / Necessary when using the other Sorting options.
		var totalHeight = 0;
		// Calculate the total of link wrappers height
		var wraps = document.querySelectorAll('.link-wrap');
		for (var w = 0; w < wraps.length; w++) {
			totalHeight += wraps[w].offsetHeight;
		}
		// Get each element's static section height
		var containerHeight = document.body.offsetHeight,
		    headerHeight = $$.q('header').offsetHeight,
		    message = $$.q('.loader'),
		    messageHeight = message ? message.offsetHeight : 0;

		var minHeight = containerHeight - headerHeight - messageHeight;

		if (totalHeight > minHeight) {
			$("#main-overflow").css('min-height', '');
		} else {
			$("#main-overflow").css('min-height', minHeight - totalHeight + 1);
		}
	};

	var supportOrientation = typeof window.orientation !== 'undefined';

	var getScrollTop = function getScrollTop() {
		return window.pageYOffset || document.compatMode === 'CSS1Compat' && document.documentElement.scrollTop || document.body.scrollTop || 0;
	};

	var scrollTop = function scrollTop() {
		if (!supportOrientation) {
			return;
		}
		document.body.style.height = screen.height + 'px';
		setTimeout(function () {
			window.scrollTo(0, 1);
			var top = getScrollTop();
			window.scrollTo(0, top === 1 ? 0 : 1);
			document.body.style.height = window.innerHeight + 'px';
		}, 1);
	};

	var iPadScrollFix = function iPadScrollFix() {
		// This slight height change makes the menu container 'overflowy', to allow scrolling again on iPad - weird bug
		var nextHeight = '36px' === $('.menu-desc').css('height') ? '35px' : '36px';
		setTimeout(function () {
			$('.menu-desc').css('height', nextHeight);
		}, 500);
	};

	var initListeners = function initListeners() {

		// Show option to reload app after update
		if (window.applicationCache) {
			window.applicationCache.addEventListener("updateready", function () {
				var delay = 1;
				if (Menu.isShowing()) {
					Menu.move(Move.LEFT);
					delay = 301;
				}
				setTimeout(function () {
					el.mainWrap.prepend("<button class='btn blck mrgn-cntr-x mrgn-y' id='btn-update' onclick='window.location.reload();'>Reeddit updated. Press to reload</button>");
				}, delay);
			}, false);
		}

		// Do stuff after finishing resizing the windows
		window.addEventListener("resizeend", function () {
			is.wideScreen = wideScreenBP.matches;
			is.largeScreen = largeScreenBP.matches;
			scrollTop();
			if (is.largeScreen && Menu.isShowing()) {
				Menu.move(Move.LEFT);
			}
			if (is.iPad) {
				iPadScrollFix();
			}
		}, false);

		if (is.iPhone && is.iOS7) {
			var hasSwiped = false;
			document.addEventListener('touchstart', function (ev) {
				var touchX = ev.targetTouches[0].clientX;
				hasSwiped = touchX < 20 || touchX > window.innerWidth - 20;
			});
			document.addEventListener('touchend', function () {
				hasSwiped = false;
			});
		}

		// Pseudo-hash-router
		window.addEventListener('hashchange', function () {
			if (is.iPhone && is.iOS7) {
				// Switch `transition-duration` class,
				// to stop animation when swiping
				if (hasSwiped) {
					el.mainView.addClass(classes.swipe);
					el.detailView.addClass(classes.swipe);
					Header.el.btnNavBack.addClass(classes.swipe);
					Header.el.subtitle.addClass(classes.swipe);
				} else {
					el.mainView.removeClass(classes.swipe);
					el.detailView.removeClass(classes.swipe);
					Header.el.btnNavBack.removeClass(classes.swipe);
					Header.el.subtitle.removeClass(classes.swipe);
				}
				hasSwiped = false;
			}
			// Handle Hash Changes
			if (location.hash === "") {
				// To Main View
				backToMainView();
				Posts.clearSelected();
				Footer.setPostTitle();
				setTimeout(function () {
					el.detailWrap.empty();
				}, is.wideScreen ? 1 : 301);
			} else {
				// To Comment View
				Comments.navigateFromHash();
			}
		}, false);

		// Presses

		UI.el.body.on('click', '.js-btn-refresh', function (ev) {
			ev.preventDefault();
			var origin = this.dataset.origin;
			switch (origin) {
				case 'footer-main':
					Posts.refreshStream();
					break;
				case 'footer-detail':
					if (!Comments.getCurrentThread()) {
						return;
					}
					Comments.show(Comments.getCurrentThread(), true);
					break;
				default:
					if (currentView === View.COMMENTS) {
						if (!Comments.getCurrentThread()) {
							return;
						}
						Comments.show(Comments.getCurrentThread(), true);
					}
					if (currentView === View.MAIN) {
						Posts.refreshStream();
					}
			}
		});

		el.body.on('click', '.close-form', function (ev) {
			ev.preventDefault();
			Modal.remove();
		});
		el.body.on('click', '.close-thread', function (ev) {
			ev.preventDefault();
			// Modal.remove();
			$(".detail-view").removeClass("show-view");
			$(".main-view").addClass("show-view");
		});

		// Swipes
		if (is.mobile) {
			if (!(is.iPhone && is.iOS7)) {
				el.detailView.swipeRight(function () {
					if (is.wideScreen) {
						return;
					}
					location.hash = "#";
				});
			}

			el.mainView.swipeRight(function () {
				if (!is.desktop && Posts.areLoading() || is.largeScreen) {
					return;
				}
				if (currentView === View.MAIN) {
					Menu.move(Move.RIGHT);
				}
			});

			el.mainView.swipeLeft(function () {
				if (!is.desktop && Posts.areLoading() || is.largeScreen) {
					return;
				}
				if (Menu.isShowing()) {
					Menu.move(Move.LEFT);
				}
			});

			el.mainView.on("swipeLeft", ".link", function () {
				if (is.wideScreen) {
					return;
				}
				if (!Menu.isShowing()) {
					var id = $(this).data("id");
					Comments.updateHash(id);
				}
			});
		}

		// Keys

		el.body.on('keydown', function (ev) {

			if (Modal.isShowing()) {
				return;
			}

			switch (ev.which) {
				case keyCode.MENU:
					if (!is.largeScreen) {
						// Mobile
						if (getCurrentView() === View.MAIN) {
							Menu.move(Move.RIGHT);
						} else {
							return;
						}
					}
					Menu.el.mainMenu.focus();
					break;
				case keyCode.MAIN:
					if (!is.largeScreen) {
						// Mobile
						if (getCurrentView() === View.MAIN) {
							Menu.move(Move.LEFT);
						} else {
							window.location.hash = '';
						}
					}
					el.mainWrap.focus();
					break;
				case keyCode.DETAIL:
					if (!is.largeScreen && getCurrentView() === View.MAIN) {
						return;
					}
					el.detailWrap.focus();
					break;
			}
		});
	};

	// Exports
	return {
		el: el,
		classes: classes,
		View: View,
		Move: Move,
		template: template,
		initListeners: initListeners,
		setCurrentView: setCurrentView,
		getCurrentView: getCurrentView,
		setSubTitle: setSubTitle,
		scrollTop: scrollTop,
		iPadScrollFix: iPadScrollFix,
		scrollFixLinks: scrollFixLinks,
		addLoader: addLoader,
		backToMainView: backToMainView,
		switchDisplay: switchDisplay
	};
})();
/* global
 $,
 $$,
 is,
 UI,
 Modal,
 Store
 */

'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var Backup = (function () {

	var update = 1;

	var el = {
		buttonExportData: $('#exp-data'),
		buttonImportData: $('#imp-data')
	};

	var template = {
		exportData: '\n\t\t<div class=\'new-form move-data\'>\n\t\t\t' + UI.template.closeModalButton + '\n\t\t\t<div class=\'move-data-exp\'>\n\t\t\t\t<h3>Export Data</h3>\n\t\t\t\t<p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p>\n\t\t\t\t<a class="btn no-ndrln txt-cntr blck w-100 mrgn-y pad-y"\n\t\t\t\t   id="btn-download-data"\n\t\t\t\t   download="reedditdata.json">Download Data</a>\n\t\t\t</div>\n\t\t</div>',
		importData: '\n\t\t<div class=\'new-form move-data\'>\n\t\t\t' + UI.template.closeModalButton + '\n\t\t\t<div class=\'move-data-imp\'>\n\t\t\t\t<h3>Import Data</h3>\n\t\t\t\t<p>Load the subscriptions from another Reeddit instance.</p>\n\t\t\t\t<p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p>\n\t\t\t\t<button class=\'btn w-100 mrgn-y pad-y\'\n\t\t\t\t\t\t    id=\'btn-trigger-file\'>Choose Backup file</button>\n\t\t\t\t<input id=\'file-chooser\'\n\t\t\t\t\t\t\t class="hide"\n\t\t\t\t\t     type="file" />\n\t\t\t</div>\n\t\t</div>'
	};

	var shouldUpdate = function shouldUpdate() {
		update = 1;
	};

	var getBackupData = function getBackupData() {
		return "{\"channels\": " + Store.getItem("channels") + ", \"subreddits\": " + Store.getItem("subreeddits") + "}";
	};

	var prepareDownloadButton = function prepareDownloadButton(data) {
		var buttonDownload = $$.id('btn-download-data');
		// buttonDownload.href = "data:text/json;charset=utf-8," + encodeURIComponent(data);
	};

	var createBackup = function createBackup() {
		if (!update) {
			return;
		}

		Modal.show(template.exportData, function () {
			prepareDownloadButton(getBackupData());
		});
	};

	var loadData = function loadData(data) {
		var refresh = false;

		if (typeof data === "string") {
			data = JSON.parse(data);
		}

		if (data.subreddits) {
			Store.setItem("subreeddits", JSON.stringify(data.subreddits));
		}
		if (data.discards) {
			Store.setItem("discards", JSON.stringify(data.discards));
		}
		if (data.archives) {
			Store.setItem("archives", JSON.stringify(data.archives));
		}
		if (data.comments) {
			Store.setItem("comments", JSON.stringify(data.comments));
		}
		refresh = true;
		// if (data.channels) {
		// 	refresh = true;
		// 	Store.setItem("channels", JSON.stringify(data.channels));
		// }
		if (refresh) {
			window.location.reload();
		}
	};

	var readFile = function readFile(file) {
		var reader = new FileReader();
		reader.onload = function () {
			loadData(reader.result);
		};
		reader.readAsText(file);
	};

	var initListeners = function initListeners() {

		// On Menu
		el.buttonExportData.on('click', function (ev) {
			ev.preventDefault();
			createBackup();
		});

		el.buttonImportData.on('click', function (ev) {
			ev.preventDefault();
			Modal.show(template.importData, function () {
				if (is.iOS) {
					UI.switchDisplay($$.id('btn-trigger-file'), true);
					UI.switchDisplay($$.id('file-chooser'), false);
				}
			});
		});

		// Forms
		UI.el.body.on('change', '#file-chooser', function (evt) {
			var config = {
				locateFile: function locateFile(filename) {
					return 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/dist/' + filename;
				}
			};
			var f = evt.target.files[0];
			var r = new FileReader();
			r.onload = function () {
				var Uints = new Uint8Array(r.result);
				// console.log(Uints);
				initSqlJs(config).then(function (SQL) {
					var db = new SQL.Database(Uints);
					console.log(db);
					console.log('Database loaded from file successfully');
					// You can run queries to check the loaded database
					var contents = db.exec("SELECT * FROM subreddits");
					var discards = db.exec("SELECT * FROM discards");
					var archives = db.exec("SELECT * FROM archives");
					var comments = db.exec("SELECT * FROM comments");
					console.log(contents, discards, archives, comments);
					var defaults = [];
					if (contents.length > 0) {
						for (var j = 0; j < contents[0].values.length; j++) {
							defaults.push({
								"subreddit": contents[0].values[j][0],
								"regex": contents[0].values[j][1]
							});
						}
					}
					var commentsData = [];
					if (comments.length > 0) {
						for (var u = 0; u < comments[0].values.length; u++) {
							commentsData.push({
								"id": comments[0].values[u][0],
								"count": comments[0].values[u][1],
								"subreddit": comments[0].values[u][2]
							});
						}
					}
					var discardsData = [];
					if (discards.length > 0) {
						for (var k = 0; k < discards[0].values.length; k++) {
							discardsData.push(discards[0].values[k][0]);
						}
					}
					var archivesData = [];
					if (archives.length > 0) {
						for (var q = 0; q < archives[0].values.length; q++) {
							archivesData.push(archives[0].values[q][0]);
						}
					}
					loadData({ subreddits: defaults, discards: discardsData, archives: archivesData, comments: commentsData });
				});
			};
			r.readAsArrayBuffer(f);
			// readFile(file);
		});

		UI.el.body.on('click', '#btn-trigger-file', function () {
			$$.id('file-chooser').click();
		});
		UI.el.body.on('click', '#btn-download-data', function () {
			var initSqlJs = window.initSqlJs;
			var DB_NAME = 'reddit_db';
			var initDb = function initDb() {
				return new Promise(function (resolve, reject) {
					initSqlJs({
						locateFile: function locateFile(file) {
							return 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.3.0/dist/' + file;
						}
					}).then(function (SQL) {
						var subs = Store.getItem("subreeddits");
						var discards = Store.getItem("discards");
						var archives = Store.getItem("archives");
						var archives_comments = Store.getItem("archives_comments");
						if (subs) {
							subs = JSON.parse(subs);
						}

						var db = new SQL.Database();
						db.run("CREATE TABLE subreddits(subreddit text, regex text);");
						db.run("CREATE TABLE discards(id text);");
						db.run("CREATE TABLE archives(id text);");
						db.run("CREATE TABLE comments(id text, count text, subreddit text);");
						for (var i = 0; i < subs.length; i++) {
							var result = db.exec("SELECT * FROM subreddits WHERE subreddit='" + subs[i].subreddit + "';");
							if (result.length == 0) {
								db.run("INSERT INTO subreddits VALUES ('" + subs[i].subreddit + "', '" + subs[i].regex + "');");
							}
						}
						if (discards) {
							discards = JSON.parse(discards);
							for (var j = 0; j < discards.length; j++) {
								db.run("INSERT INTO discards VALUES ('" + discards[j] + "');");
							}
						}
						if (archives) {
							archives = JSON.parse(archives);
							for (var p = 0; p < archives.length; p++) {
								db.run("INSERT INTO archives VALUES ('" + archives[p] + "');");
							}
						}
						if (archives_comments) {
							archives_comments = JSON.parse(archives_comments);
							for (var r = 0; r < archives_comments.length; r++) {
								db.run("INSERT INTO comments VALUES ('" + archives_comments[r].id + "', '" + archives_comments[r].comments + "', '" + archives_comments[r].subreddit + "');");
							}
						}
						resolve(db);
					})['catch'](function (error) {
						reject(error);
					});
				});
			};
			initDb().then(function (db) {
				var binaryArray = db['export'](); // Convert the db to binary array
				window.localStorage.setItem("dbBackup", JSON.stringify([].concat(_toConsumableArray(binaryArray))));
				var arr = JSON.parse(window.localStorage.getItem("dbBackup"));
				var blob = new Blob([new Uint8Array(arr)], { type: "application/octet-stream" });
				var url = URL.createObjectURL(blob);
				var a = document.createElement("a");
				a.href = url;
				a.download = "db.sqlite";
				a.click();
				console.log('Database downloaded successfully');
			})['catch'](function (error) {
				console.error("Error initializing database:", error);
			});
		});
	};

	// Exports
	return {
		initListeners: initListeners,
		shouldUpdate: shouldUpdate
	};
})();
/* global
 Posts,
 Subreddits,
 Anim,
 UI,
 Modal,
 is,
 Store,
 Backup,
 CurrentSelection,
 Mustache,
 URLs
 */

"use strict";

var Channels = (function () {

	var defaults = {
		name: "Media",
		subs: ["movies", "television", "music", "games", "books"]
	};

	var singleItemTemplate = '<a href="#{{name}}" class="channel pad-x no-ndrln blck" data-title="{{name}}"><div class="channel__title">{{name}}</div><div class="pad-x">{{#subs}}<div class="channel__sub txt-cap txt-ellps">{{.}}</div>{{/subs}}</div></a>';

	var tmpltButtonAddAnotherSub = '<button class="w-100" id="btn-add-another-sub">Add additional subreddit</button>';

	var template = {
		singleEditItem: "<div class='item-to-edit flx channel-to-remove' data-title='{{name}}'><p class='sub-name w-85 txt-cap txt-bld channel-name'>{{name}}</p><a href='#edit' class='flx flx-cntr-x flx-cntr-y w-15 no-ndrln clr-current btn-edit-channel icon-pencil' data-title='{{name}}'></a><a href='#remove' class='flx flx-cntr-x flx-cntr-y w-15 no-ndrln clr-current btn-remove-channel icon-trashcan' data-title='{{name}}'></a></div>",
		single: singleItemTemplate,
		list: "{{#.}}" + singleItemTemplate + "{{/.}}",
		formAddNew: "<div class=\"new-form\" id=\"form-new-channel\"><div class=\"form-left-corner\"><button class=\"btn\" id=\"btn-submit-channel\" data-op=\"save\">Add Channel</button></div>" + UI.template.closeModalButton + "<input type=\"text\" id=\"txt-channel\" placeholder=\"Channel name\" /><div id=\"subs-for-channel\"><input class=\"field-edit-sub\" type=\"text\" placeholder=\"Subreddit 1\" /><input class=\"field-edit-sub\" type=\"text\" placeholder=\"Subreddit 2\" /><input class=\"field-edit-sub\" type=\"text\" placeholder=\"Subreddit 3\" /></div>" + tmpltButtonAddAnotherSub + "</div>",
		formEditChannel: "<div class=\"new-form\" id=\"form-new-channel\"><div class=\"form-left-corner\"><button class=\"btn\" id=\"btn-submit-channel\" data-op=\"update\">Update Channel</button></div>" + UI.template.closeModalButton + "<input type=\"text\" id=\"txt-channel\" placeholder=\"Channel name\" /><div id=\"subs-for-channel\"></div>" + tmpltButtonAddAnotherSub + "</div>"
	};

	var list = [],
	    editingNow = '';

	var el = {
		menu: $("#channels")
	};

	var getList = function getList() {
		return list;
	};

	var getURL = function getURL(channel) {
		if (channel.subs.length === 1) {
			// [1] Reddit API-related hack
			return "r/" + channel.subs[0] + "+" + channel.subs[0];
		} else {
			return "r/" + channel.subs.join("+");
		}
	};
	// [1] If there's one subreddit in a "Channel",
	// and this subreddit name's invalid,
	// reddit.com responds with a search-results HTML - not json data
	// and throws a hard-to-catch error...
	// Repeating the one subreddit in the URL avoids this problem :)

	var insert = function insert(channel) {
		list.push(channel);
		Store.setItem('channels', JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function _delete(name) {
		for (var j = 0; j < list.length; j++) {
			if (list[j].name === name) {
				list.splice(j, 1);
				break;
			}
		}
		Store.setItem('channels', JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var getByName = function getByName(name) {
		var foundChannel;
		for (var i = 0; i < list.length; i++) {
			if (list[i].name.toLowerCase() === name.toLowerCase()) {
				foundChannel = list[i];
				break;
			}
		}
		return foundChannel;
	};

	var append = function append(channel) {
		el.menu.append(Mustache.to_html(template.single, channel));
		if (Subreddits.isEditing()) {
			addToEditList(channel.name);
		}
	};

	var loadList = function loadList() {
		el.menu.html(Mustache.to_html(template.list, list));
	};

	var detach = function detach(name) {
		var deletedChannel = $('.channel-to-remove[data-title="' + name + '"]');
		deletedChannel.addClass("anim-delete");
		setTimeout(function () {
			deletedChannel.remove();
		}, 200);

		$('.channel[data-title="' + name + '"]').remove();
	};

	var addToEditList = function addToEditList(name) {
		$(".channel-edit-list").append(template.singleEditItem.replace(/\{\{name\}\}/g, name));
	};

	var add = function add(title, subreddits) {
		var channel = {
			name: title,
			subs: subreddits
		};
		insert(channel);
		append(channel);
	};

	var loadSaved = function loadSaved() {
		// Should only execute when first loading the app
		list = Store.getItem('channels');
		if (list) {
			list = JSON.parse(list);
		} else {
			// Load defaults channel(s)
			list = [defaults];
		}
		loadList();
	};

	var loadPosts = function loadPosts(channel) {
		Posts.load(URLs.init + getURL(channel) + '/');
		UI.setSubTitle(channel.name);
		CurrentSelection.setChannel(channel);
	};

	var remove = function remove(name) {
		_delete(name);
		detach(name);
		// If it was the current selection
		if (CurrentSelection.getType() === CurrentSelection.Types.CHANNEL && CurrentSelection.getName() === name) {
			CurrentSelection.setSubreddit('frontPage');
		}
	};

	var edit = function edit(name) {
		var channelToEdit = getByName(name);
		Modal.show(template.formEditChannel, function () {
			// Fill form with current values
			$("#txt-channel").val(channelToEdit.name);

			editingNow = channelToEdit.name;
			var $inputsContainer = $("#subs-for-channel");

			channelToEdit.subs.map(function (sub) {
				var inputTemplate = "<input class='field-edit-sub with-clear' type='text' value='" + sub + "'>";
				$inputsContainer.append(inputTemplate);
			});
		});
	};

	var initListeners = function initListeners() {

		UI.el.body.on('click', "#btn-submit-channel", function (ev) {
			var target = ev.target;
			var txtChannelName = $("#txt-channel"),
			    operation = target.getAttribute("data-op"),
			    channelName = txtChannelName.val();

			if (!channelName) {
				txtChannelName.attr("placeholder", "Enter a Channel name!");
				Anim.shakeForm();
				return;
			}

			var subreddits = [],
			    subs = $("#subs-for-channel input");

			for (var i = 0; i < subs.length; i++) {
				var sub = $(subs[i]).val();
				if (!sub) {
					continue;
				}
				subreddits.push(sub);
			}

			if (subreddits.length === 0) {
				subs[0].placeholder = "Enter at least one subreddit!";
				Anim.shakeForm();
				return;
			}

			switch (operation) {
				case "save":
					// Look for Channel name in the saved ones
					var savedChannel = getByName(channelName);
					if (savedChannel) {
						// If it's already saved
						txtChannelName.val("");
						txtChannelName.attr("placeholder", "'" + channelName + "' already exists.");
						Anim.shakeForm();
						return;
					}
					add(channelName, subreddits);
					break;

				case "update":
					// Remove current and add new
					remove(editingNow);
					add(channelName, subreddits);
					break;
			}

			// confirmation feedback
			$(target).remove();
			$(".form-left-corner").append("<div class='clr-white txt-bld channel-added-msg'>'" + channelName + "' " + operation + "d. Cool!</div>");

			Anim.bounceOut($(".new-form"), Modal.remove);
		});

		UI.el.mainWrap.on('click', '#btn-add-channel', function () {
			Modal.show(template.formAddNew);
		});

		UI.el.mainWrap.on('click', '.btn-remove-channel', function (ev) {
			ev.preventDefault();
			remove(this.dataset.title);
		});

		UI.el.mainWrap.on('click', '.btn-edit-channel', function (ev) {
			ev.preventDefault();
			edit(this.dataset.title);
		});
	};

	// Exports
	return {
		getList: getList,
		getByName: getByName,
		getURL: getURL,
		loadPosts: loadPosts,
		loadSaved: loadSaved,
		initListeners: initListeners,
		template: {
			formAddNew: template.formAddNew,
			singleEditItem: template.singleEditItem
		}
	};
})();
/* global
 $,
 El,
 Posts,
 Markdown,
 UI,
 LinkSummary,
 Footer,
 Header,
 Anim,
 Menu,
 Modal,
 is,
 timeSince,
 URLs
 */

'use strict';

var Comments = (function () {

	var loading = false,
	    replies = {},
	    currentThread;

	var setLoading = function setLoading(areLoading) {
		loading = areLoading;
	};

	var getCurrentThread = function getCurrentThread() {
		return currentThread;
	};

	var updateHash = function updateHash(id) {
		location.hash = '#comments:' + id;
	};

	var getIdFromHash = function getIdFromHash() {
		var match = location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);
		if (match && match[2]) {
			return match[2];
		}
	};

	var navigateFromHash = function navigateFromHash() {
		var id = getIdFromHash();
		show(id);
		if (is.wideScreen) {
			Posts.markSelected(id);
		}
	};

	var showLoadError = function showLoadError(loader) {
		loading = false;
		var error = 'Error loading comments. Refresh to try again.';
		if (is.wideScreen) {
			loader.addClass("loader-error").html(error + '<button class="btn mrgn-cntr-x mrgn-y blck w-33 js-btn-refresh">Refresh</button>');
		} else {
			loader.addClass("loader-error").text(error);
		}
		if (!is.desktop) {
			UI.el.detailWrap.append($("<section/>"));
		}
	};

	var load = function load(data, baseElement, idParent) {
		var now = new Date().getTime(),
		    converter = new Markdown.Converter(),
		    com = $("<div/>").addClass('comments-level');
		for (var i = 0; i < data.length; i++) {
			var c = data[i];

			if (c.kind !== "t1") {
				continue;
			}
			var html = converter.makeHtml(c.data.body),
			    isPoster = Posts.getList()[currentThread].author === c.data.author,
			    permalink = URLs.init + Posts.getList()[currentThread].link + c.data.id,
			    commentLink = {
				href: permalink,
				target: "_blank",
				title: "See this comment on reddit.com",
				tabindex: "-1"
			};
			var comment = $("<div/>").addClass("comment-wrap").attr('tabindex', '0').append($('<div/>').append($("<div/>").addClass("comment-data").append($("<span/>").addClass(isPoster ? "comment-poster" : "comment-author").text(c.data.author)).append($("<a/>").addClass("comment-info no-ndrln").attr(commentLink).text(timeSince(now, c.data.created_utc)))).append($("<div/>").addClass("comment-body").html(html)));
			if (c.data.replies && c.data.replies.data.children[0].kind !== "more") {
				comment.append($("<button/>").addClass("btn blck comments-button js-reply-button")
				// .addClass("btn blck mrgn-cntr-x comments-button js-reply-button")
				.attr("data-comment-id", c.data.id).text("See replies (" + c.data.replies.data.children.length + ")"));
				replies[c.data.id] = c.data.replies.data.children;
			}

			com.append(comment);
		}

		baseElement.append(com);

		if (idParent) {
			Posts.getLoaded()[idParent] = com;
		}
		var allhref = UI.el.detailWrap.find('a');
		for (var k = 0; k < allhref.length; k++) {
			var atag = allhref[k];
			var href = $(atag).attr('href');
			if (href.match(/\.(jpeg|jpg|gif|png)/) != null) {
				if (!$(atag).attr('class')) {
					console.log($(atag));
					$(atag).html('<img class="video-preview" \n\t\t\t\t\tsrc="' + href + '"/>');
				}
			}
		}
		UI.el.detailWrap.find('a').attr('target', '_blank');
	};

	var show = function show(id, refresh) {
		if (!Posts.getList()[id]) {
			currentThread = id;

			var loader = UI.addLoader(UI.el.detailWrap);
			loading = true;

			$.ajax({
				dataType: 'jsonp',
				url: URLs.init + "comments/" + id + "/" + URLs.end,
				success: function success(result) {
					loader.remove();
					loading = false;

					Posts.setList(result[0].data);
					LinkSummary.setPostSummary(result[0].data.children[0].data, id);

					Header.el.btnNavBack.removeClass(UI.classes.invisible); // Show

					setRest(id, refresh);

					load(result[1].data.children, $('#comments-container'), id);
				},
				error: function error() {
					showLoadError(loader);
				}
			});
		} else {
			var delay = 0;
			if (Menu.isShowing()) {
				Menu.move(UI.Move.LEFT);
				delay = 301;
			}
			setTimeout(function () {

				if (loading && currentThread && currentThread === id) {
					return;
				}

				loading = true;
				currentThread = id;

				Header.el.btnNavBack.removeClass(UI.classes.invisible); // Show

				var detail = UI.el.detailWrap;
				detail.empty();

				UI.el.detailWrap[0].scrollTop = 0;

				if (Posts.getLoaded()[id] && !refresh) {
					detail.append(Posts.getList()[id].summary);
					$('#comments-container').append(Posts.getLoaded()[id]);
					LinkSummary.updatePostSummary(Posts.getList()[id], id);
					loading = false;
				} else {
					LinkSummary.setPostSummary(Posts.getList()[id], id);
					var url = URLs.init + Posts.getList()[id].link + URLs.end;

					var loader = UI.addLoader(detail);

					$.ajax({
						dataType: 'jsonp',
						url: url,
						success: function success(result) {
							if (currentThread !== id) {
								// In case of trying to load a different thread before this one loaded.
								// TODO: handle this better
								return;
							}
							LinkSummary.updatePostSummary(result[0].data.children[0].data, id);
							loader.remove();
							load(result[1].data.children, $('#comments-container'), id);
							loading = false;
						},
						error: function error() {
							showLoadError(loader);
						}
					});
				}

				setRest(id, refresh);
			}, delay);
		}
	};

	var setRest = function setRest(id, refresh) {
		var postTitle = Posts.getList()[id].title;
		var delay = 0;

		if (!refresh) {
			Footer.setPostTitle(postTitle);
		}

		if (!refresh && UI.getCurrentView() !== UI.View.COMMENTS) {
			Anim.slideFromRight();
			delay = 301;
		}

		Header.el.centerSection.empty().append(Header.el.postTitle);
		Header.el.postTitle.text(postTitle);
		Header.el.subtitle.addClass(UI.classes.invisible);

		if (!is.wideScreen) {
			setTimeout(function () {
				UI.el.detailWrap.focus();
			}, delay);
		}
	};

	var initListeners = function initListeners() {

		UI.el.detailWrap.on('click', '#comments-container a, #selftext a', function (ev) {
			var imageURL = LinkSummary.checkImageLink(this.href);
			if (imageURL) {
				ev.preventDefault();
				Modal.showImageViewer(imageURL);
			}
		});

		UI.el.detailWrap.on('click', '.js-reply-button', function () {
			var button = $(this),
			    commentID = button.attr('data-comment-id'),
			    comments = replies[commentID];
			load(comments, button.parent());
			if (is.iOS) {
				$('.comment-active').removeClass('comment-active');
				button.parent().addClass('comment-active');
			}
			button.remove();
		});
	};

	// Exports
	return {
		initListeners: initListeners,
		navigateFromHash: navigateFromHash,
		getCurrentThread: getCurrentThread,
		show: show,
		updateHash: updateHash,
		setLoading: setLoading,
		getIdFromHash: getIdFromHash
	};
})();
/* global
 Store
 */

'use strict';

var CurrentSelection = (function () {

	var name = '',
	    type = '';

	var Types = {
		SUB: 1,
		CHANNEL: 2
	};

	var storeKey = 'currentSelection';

	var getName = function getName() {
		return name;
	};

	var getType = function getType() {
		return type;
	};

	var set = function set(newName, newType) {
		name = newName;
		type = newType;
		Store.setItem(storeKey, JSON.stringify({ name: name, type: type }));
	};

	var loadSaved = function loadSaved() {
		var loadedSelection = Store.getItem(storeKey);

		if (loadedSelection) {
			loadedSelection = JSON.parse(loadedSelection);
		}

		name = loadedSelection ? loadedSelection.name : 'frontPage';
		type = loadedSelection ? loadedSelection.type : Types.SUB;
	};

	var setSubreddit = function setSubreddit(sub) {
		set(sub, Types.SUB);
	};

	var setChannel = function setChannel(channel) {
		set(channel.name, Types.CHANNEL);
	};

	var execute = function execute(caseSub, caseChannel) {
		switch (type) {
			case Types.SUB:
				caseSub();
				break;
			case Types.CHANNEL:
				caseChannel();
				break;
		}
	};

	// Exports
	return {
		getName: getName,
		getType: getType,
		Types: Types,
		loadSaved: loadSaved,
		setSubreddit: setSubreddit,
		setChannel: setChannel,
		execute: execute
	};
})();
/* global
 $,
 UI
 */

'use strict';

var Footer = (function () {

	var refreshButton = '';

	var noLink = "No Post Selected";

	var el = {
		detail: $('#detail-footer'),
		postTitle: $('#footer-post'),
		subTitle: $('#footer-sub'),

		getRefreshButton: function getRefreshButton() {
			if (!refreshButton) {
				refreshButton = document.querySelector('#main-footer .footer-refresh');
			}
			return refreshButton;
		}
	};

	var setPostTitle = function setPostTitle(title) {
		el.postTitle.text(title ? title : noLink);
		var buttons = el.detail.find('.btn-footer');
		if (title) {
			buttons.removeClass(UI.classes.hide);
		} else {
			buttons.addClass(UI.classes.hide);
		}
	};

	// Exports
	return {
		el: el,
		setPostTitle: setPostTitle
	};
})();
/* global
 $,
 is,
 Menu,
 Posts,
 UI
 */

'use strict';

var Header = (function () {

	var el = {
		subtitle: $('#main-title'),
		subtitleText: $('#sub-title'),
		centerSection: $('#title-head'),
		postTitle: $('#title'),
		icon: $('#header-icon'),
		btnNavBack: $('#nav-back')
	};

	var initListeners = function initListeners() {
		el.subtitleText.on('click', function () {
			if (is.mobile && Posts.areLoading()) {
				return;
			}
			Menu.move(Menu.isShowing() ? UI.Move.LEFT : UI.Move.RIGHT);
		});
	};

	// Exports
	return {
		el: el,
		initListeners: initListeners
	};
})();
/* global
 Posts,
 Mustache,
 El,
 Footer,
 timeSince,
 Markdown,
 UI,
 Modal
 */

"use strict";

var LinkSummary = (function () {

	var template = "\n\t\t<section id='link-summary'>\n\t\t\t" + UI.template.closeThreadButton + "\n\t\t\t<a href='{{url}}' style='max-width:97%;'\n\t\t\t   target='_blank'\n\t\t\t   class='no-ndrln'>\n\t\t\t\t<span id='summary-title'\n\t\t\t\t\t  class='pad-x txt-bld blck'>{{title}}</span>\n\t\t\t\t<span id='summary-domain'\n\t\t\t\t\t  class='pad-x txt-bld'>{{domain}}</span>\n\t\t\t\t{{#over_18}}\n\t\t\t\t<span class='link-label txt-bld summary-label nsfw'>NSFW</span>\n\t\t\t\t{{/over_18}}\n\t\t\t\t{{#stickied}}\n\t\t\t\t<span class='link-label txt-bld summary-label stickied'>Stickied</span>\n\t\t\t\t{{/stickied}}\n\t\t\t</a>\n\t\t\t<div id='summary-footer'>\n\t\t\t\t<span id='summary-author'\n\t\t\t\t\t  class='pad-x txt-bld'>by {{author}}</span>\n\t\t\t</div>\n\t\t\t<div id='summary-preview'>\n\t\t\t</div>\n\t\t\t<div id='summary-btn'>\n\t\t\t\t<a class='btn mrgn-x no-ndrln save-tw'\n\t\t\t\t\t  id='share-tw'\n\t\t\t\t\t  rid='{{name}}'\n\t\t\t\t\t  href='#'>Save</a>\n\t\t\t\t<a class='btn mrgn-x no-ndrln'\n\t\t\t\t   id='share-tw'\n\t\t\t\t   target='_blank'\n\t\t\t\t   href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a>\n\t\t\t\t<a class='btn mrgn-x no-ndrln discard-tw'\n\t\t\t\t   id='discard-tw'\n\t\t\t\t   rid='{{name}}'\n\t\t\t\t   href='#'>Discard</a>\n\t\t\t</div>\n\t\t\t<div class='ls-extra flx flx-spc-btwn-x txt-bld'>\n\t\t\t\t<span class='w-33'\n\t\t\t\t\t  id='summary-sub'>{{subreddit}}</span>\n\t\t\t\t<span class='w-33 txt-cntr'\n\t\t\t\t\t  id='summary-time'></span>\n\t\t\t\t<a class='w-33 no-ndrln txt-r clr-current'\n\t\t\t\t   id='summary-comment-num'\n\t\t\t\t   title='See comments on reddit.com'\n\t\t\t\t   href='http://reddit.com{{link}}'\n\t\t\t\t   target='_blank'>{{num_comments}} comments</a>\n\t\t\t</div>\n\t\t</section>";

	var setPostSummary = function setPostSummary(data, postID) {
		if (!data.link) {
			data.link = data.permalink;
		}
		// Main content
		var summaryHTML = Mustache.to_html(template, data);
		// Check for type of post
		if (data.selftext) {
			// If it's a self-post
			var selfText;
			if (Posts.getList()[postID].selftextParsed) {
				selfText = Posts.getList()[postID].selftext;
			} else {
				var summaryConverter1 = new Markdown.Converter();
				selfText = summaryConverter1.makeHtml(data.selftext);
				Posts.getList()[postID].selftext = selfText;
				Posts.getList()[postID].selftextParsed = true;
			}
			var searchString = "&amp;#x200B;";
			var replacementString = " ";
			var re = new RegExp(searchString, 'g');
			var newString = selfText.replace(re, replacementString);
			summaryHTML += "<section id='selftext' class='pad-x mrgn-x mrgn-y'>" + newString + "</section>";
		}
		// else { // if it's an image
		var linkURL = Posts.getList()[postID].url;
		var imageURL = "";
		if (Posts.getList()[postID].preview) {
			imageURL = Posts.getList()[postID].preview.images[0].source.url;
		}
		var imageLink = checkImageLink(imageURL);

		var isGallery = Posts.getList()[postID].is_gallery;
		var gallery_data = Posts.getList()[postID].gallery_data;
		var media_metadata = Posts.getList()[postID].media_metadata;
		var domain = Posts.getList()[postID].domain;
		console.log(Posts.getList()[postID], 'check');
		if (linkURL) {
			// if it's a YouTube video
			var youTubeID = getYouTubeVideoIDfromURL(linkURL);

			if (youTubeID) {
				summaryHTML += "<a class=\"video-preview-btn preview-container blck\" \n\t\t\t\t\t\t\t\thref=\"#\" data-id=\"" + youTubeID + "\">\n\t\t\t\t\t\t <img class=\"video-preview\" \n\t\t\t\t\t\t      src=\"//img.youtube.com/vi/" + youTubeID + "/hqdefault.jpg\"/>\n\t\t\t\t\t\t </a>\n\t\t\t\t\t\t <div class=\"video-preview-box\"></div>";
			} else if (domain == 'v.redd.it') {
				if (Posts.getList()[postID].secure_media) {
					summaryHTML += "<div style=\"text-align:center;\">\n\t\t\t\t\t\t\t\t<video id=\"videoPlayer\" style=\"width:80%;\" controls></video>\n\t\t\t\t\t\t\t</div>";
				} else {
					summaryHTML += '<a href="#preview" class="preview-container blck js-img-preview" data-img="' + imageLink + '">' + '<img class="image-preview" src="' + imageLink + '" height=500 />' + '</a>';
				}
			} else if (isGallery) {
				summaryHTML += '<div class="wrapper_gallery">';
				for (var i = 0; i < gallery_data.items.length; i++) {
					summaryHTML += "\n\t\t\t\t\t\t<div class=\"card_gallery\">\n\t\t\t\t\t\t\t<a href=\"#preview\" target=\"_blank\" class=\"preview-container blck js-gallery-preview\" data-img=\"" + media_metadata[gallery_data.items[i].media_id].s.u + "\">\n\t\t\t\t\t\t\t<img src=\"" + media_metadata[gallery_data.items[i].media_id].p[0].u + "\" class=\"cover_gallery image-preview\" alt=\"\">\n\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t</div>";
				}
				summaryHTML += '</div>';
			} else if (imageLink) {
				// If it's an image link
				summaryHTML +=
				// '<a href="'+imageLink+'" target="_blank" class="preview-container blck js-img">' +
				// '<img class="image-previews" src="' + imageLink + '" />' +
				// '</a>';
				'<a href="#preview" class="preview-container blck js-img-preview" data-img="' + imageLink + '">' + '<img class="image-preview" src="' + imageLink + '" height=500 />' + '</a>';
			} else {
				// if it's a Gfycat or RedGifs link
				var gfycatID = getGfycatIDfromURL(linkURL);
				var redGifsID = getRedGifsIDfromURL(linkURL);
				if (gfycatID) {
					summaryHTML += "<div style='position:relative; padding-bottom:56.69%'>" + "<iframe src='https://gfycat.com/ifr/" + gfycatID + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>" + "</div>";
				} else if (redGifsID) {
					summaryHTML += "<div style='position:relative; padding-bottom:56.69%'>" + "<iframe src='https://redgifs.com/ifr/" + redGifsID + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>" + "</div>";
				}
			}
		}
		// }
		summaryHTML += "<section id='comments-container'></section>";
		UI.el.detailWrap.append(summaryHTML);
		setTimeout(function () {
			if (domain == 'v.redd.it') {
				var player = dashjs.MediaPlayer().create();
				player.initialize(document.querySelector("#videoPlayer"), Posts.getList()[postID].secure_media.reddit_video.dash_url, false);
			}
		});
		updatePostTime(data.created_utc);
		Posts.getList()[postID].summary = summaryHTML;
		Footer.el.postTitle.text(data.title);
	};

	var updatePostSummary = function updatePostSummary(data, postID) {
		$("#summary-comment-num").text(data.num_comments + (data.num_comments === 1 ? ' comment' : ' comments'));
		// Time ago
		updatePostTime(data.created_utc);
		Posts.getList()[postID].num_comments = data.num_comments;
		Posts.getList()[postID].created_utc = data.created_utc;
	};

	var updatePostTime = function updatePostTime(time) {
		$("#summary-time").text(timeSince(new Date().getTime(), time));
	};

	var checkImageLink = function checkImageLink(url) {
		var matching = url.match(/\.(svg|jpe?g|png|gifv?)(?:[?#].*)?$|(?:imgur\.com|livememe\.com|reddituploads\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
		if (!matching) {
			return '';
		}
		if (matching[1]) {
			// normal image link
			if (url.indexOf('.gifv') > 0) {
				url = url.replace('.gifv', '.gif');
			}
			if (url.indexOf('imgur.com') >= 0) {
				url = url.replace(/^htt(p|ps):/, '');
			}
			return url;
		} else if (matching[2]) {
			if (matching[0].slice(0, 5) === "imgur") {
				// imgur
				return "//imgur.com/" + matching[2] + ".jpg";
			} else if (matching[0].indexOf("livememe.") >= 0) {
				// livememe
				return "http://i.lvme.me/" + matching[2] + ".jpg";
			} else if (matching[0].indexOf("reddituploads.") >= 0) {
				// reddit media
				return matching.input;
			} else {
				return null;
			}
		} else {
			return null;
		}
	};

	var getYouTubeVideoIDfromURL = function getYouTubeVideoIDfromURL(url) {
		var matching = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
		if (!matching) {
			return '';
		} else {
			if (matching[2].length === 11) {
				return matching[2];
			} else {
				return null;
			}
		}
	};

	var getGfycatIDfromURL = function getGfycatIDfromURL(url) {
		var matching = url.match(/gfycat.com\/(gifs\/detail\/)?(\w+)/i);
		if (!matching) {
			return '';
		} else {
			if (matching && matching.length > 2) {
				return matching[2];
			} else {
				return null;
			}
		}
	};

	var getRedGifsIDfromURL = function getRedGifsIDfromURL(url) {
		var matching = url.match(/redgifs.com\/(?:(?:ifr|watch)\/)(\w+)/i);
		if (!matching) {
			return '';
		} else {
			if (matching && matching.length > 1) {
				return matching[1];
			} else {
				return null;
			}
		}
	};

	var initListeners = function initListeners() {
		UI.el.detailWrap.on('click', '.js-img-preview', function (ev) {
			ev.preventDefault();
			Modal.showImageViewer(this.dataset.img);
		});
		UI.el.detailWrap.on('click', '.js-gallery-preview', function (ev) {
			ev.preventDefault();
			var gallerys = $(this).parent().parent().children();
			var img_urls = [];
			for (var y = 0; y < gallerys.length; y++) {
				var gallery = gallerys[y];
				img_urls.push($(gallery).find('a').attr('data-img'));
			}
			console.log(img_urls);
			Modal.showGalleryViewer(img_urls);
		});
		UI.el.detailWrap.on('click', '.discard-tw', function (ev) {
			ev.preventDefault();
			var id = $(this).attr('rid');
			console.log(id);
			$("#" + id).css('display', 'none');
			var discards = localStorage.getItem('discards');
			if (!discards) {
				localStorage.setItem('discards', JSON.stringify([id]));
			} else {
				discards = JSON.parse(discards);
				if (discards.indexOf(id) == -1) {
					discards.push(id);
				}
				localStorage.setItem('discards', JSON.stringify(discards));
			}
		});
		UI.el.detailWrap.on('click', '.save-tw', function (ev) {
			ev.preventDefault();
			var id = $(this).attr('rid');
			console.log(id);
			// $("#"+id).css('display', 'none');
			var archives = localStorage.getItem('archives');
			var archives_comments = localStorage.getItem('archives_comments');
			var currentSelection = localStorage.getItem('currentSelection');
			currentSelection = JSON.parse(currentSelection);
			if (!archives) {
				localStorage.setItem('archives', JSON.stringify([document.getElementById(id).outerHTML]));
				localStorage.setItem('archives_comments', JSON.stringify([{
					id: id,
					subreddit: currentSelection.name,
					comments: $("#summary-comment-num").text()
				}]));
			} else {
				archives = JSON.parse(archives);
				archives_comments = JSON.parse(archives_comments);
				if (archives.indexOf(document.getElementById(id).outerHTML) == -1) {
					archives.push(document.getElementById(id).outerHTML);
					archives_comments.push({
						id: id,
						subreddit: currentSelection.name,
						comments: $("#summary-comment-num").text()
					});
				}
				localStorage.setItem('archives', JSON.stringify(archives));
				localStorage.setItem('archives_comments', JSON.stringify(archives_comments));
			}
		});
		UI.el.detailWrap.on('click', '.video-preview-btn', function (ev) {
			ev.preventDefault();
			$(this).css('display', 'none');
			$(this).parent().find(".video-preview-box").html("<iframe \n\t\t\t\t\twidth=\"560\" \n\t\t\t\t\theight=\"315\" \n\t\t\t\t\tsrc=\"https://www.youtube.com/embed/" + $(this).attr('data-id') + "?controls=1&autoplay=0\" \n\t\t\t\t\ttitle=\"YouTube video player\" \n\t\t\t\t\tframeborder=\"0\" \n\t\t\t\t\tstyle=\"display: block;margin: 0px auto;\"\n\t\t\t\t\tallow=\"accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" \n\t\t\t\t\tallowfullscreen>\n\t\t\t\t</iframe>");
		});
	};

	// Exports
	return {
		setPostSummary: setPostSummary,
		updatePostSummary: updatePostSummary,
		checkImageLink: checkImageLink,
		initListeners: initListeners
	};
})();
/* global
 El,
 Channels,
 Subreddits,
 Modal,
 UI,
 is,
 CurrentSelection
 */

'use strict';

var Menu = (function () {

	var el = {
		mainMenu: $('#main-menu'),
		buttonNewSubreddit: $('#btn-new-sub'),
		buttonNewChannel: $('#btn-new-channel'),
		buttonAddSubreddits: $('#btn-add-subs'),
		buttonEditSubreddits: $('#btn-edit-subs'),
		buttonAbout: $('#about')
	};

	var showing = false;

	var isShowing = function isShowing() {
		return showing;
	};

	var template = {
		about: '<div class=\'new-form about-reeddit\'>' + UI.template.closeModalButton + '<ul><li><a href=\'/about/\' target=\'_blank\'>Reeddit Homepage</a></li><li><a href=\'https://github.com/berbaquero/reeddit\' target=\'_blank\'>GitHub Project</a></li></ul><p><a href=\'https://twitter.com/reedditapp\'>@ReedditApp</a></p><p>Built by <a href=\'http://berbaquero.com\' target=\'_blank\'>Bernardo Baquero Stand</a></p></div>'
	};

	var subSelectedClass = 'sub--selected',
	    channelSelectedClass = 'channel--selected';

	var move = function move(direction) {
		if (is.iPhone && is.iOS7) {
			UI.el.mainView.removeClass(UI.classes.swipe);
			UI.el.detailView.removeClass(UI.classes.swipe);
		}
		if (direction === UI.Move.LEFT) {
			UI.el.mainView.removeClass(UI.classes.showMenu);
			setTimeout(function () {
				showing = false;
			}, 1);
		}
		if (direction === UI.Move.RIGHT) {
			UI.el.mainView.addClass(UI.classes.showMenu);
			setTimeout(function () {
				showing = true;
			}, 1);
		}
	};

	var markSelected = function markSelected(params /* {type, el, name, update} */) {
		var type = params.type;
		var el = params.el;
		var name = params.name;
		var update = params.update;

		if (update) {
			cleanSelected();
		}

		var isChannel = type && type === 'channel';

		if (el) {
			el.classList.add(isChannel ? channelSelectedClass : subSelectedClass);
			return;
		}

		if (name) {
			var selector = isChannel ? '.channel[data-title="' + name + '"]' : '.sub[data-name="' + name + '"]';

			var activeSub = document.querySelector(selector);
			activeSub.classList.add(isChannel ? channelSelectedClass : subSelectedClass);
		}
	};

	var cleanSelected = function cleanSelected() {
		$(".sub.sub--selected").removeClass(subSelectedClass);
		$(".channel.channel--selected").removeClass(channelSelectedClass);
	};

	var initListeners = function initListeners() {

		el.mainMenu.on('click', '.channel', function (ev) {
			ev.preventDefault();
			var target = this;
			var channelName = target.getAttribute('data-title');
			Menu.move(UI.Move.LEFT);
			if (channelName === CurrentSelection.getName() && !Subreddits.isEditing()) {
				return;
			}
			Menu.markSelected({ type: 'channel', el: target, update: true });
			if (UI.getCurrentView() === UI.View.COMMENTS) {
				UI.backToMainView();
			}
			Channels.loadPosts(Channels.getByName(channelName));
		});

		el.mainMenu.on('click', '.sub', function (ev) {
			ev.preventDefault();
			$(".sub--selected").removeClass('sub--selected');
			var target = ev.target;
			Menu.move(UI.Move.LEFT);
			Subreddits.loadPosts(target.dataset.name);
			markSelected({ el: target, update: true });
			if (UI.getCurrentView() === UI.View.COMMENTS) {
				UI.backToMainView();
			}
		});

		el.buttonNewSubreddit.on('click', function (ev) {
			ev.preventDefault();
			Modal.show(Subreddits.template.formInsert);
		});

		el.buttonNewChannel.on('click', function (ev) {
			ev.preventDefault();
			Modal.show(Channels.template.formAddNew);
		});

		el.buttonAddSubreddits.on('click', function (ev) {
			ev.preventDefault();
			Subreddits.loadForAdding();
		});

		el.buttonEditSubreddits.on('click', function (ev) {
			ev.preventDefault();
			Subreddits.loadForEditing();
		});

		el.buttonAbout.on('click', function (ev) {
			ev.preventDefault();
			Modal.show(template.about);
		});
	};

	// Exports
	return {
		isShowing: isShowing,
		initListeners: initListeners,
		move: move,
		markSelected: markSelected,
		cleanSelected: cleanSelected,
		el: el
	};
})();
/* global
 Menu,
 Anim,
 is,
 UI
 */

'use strict';

var Modal = (function () {

	var showing = false;

	var setShowing = function setShowing(shown) {
		showing = shown;
	};

	var isShowing = function isShowing() {
		return showing;
	};

	var show = function show(template, callback, config) {
		var delay = 1;
		if (!is.largeScreen && Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function () {
			if (isShowing()) {
				return;
			}
			var modal = $('<div/>').attr({ id: 'modal', tabindex: '0', 'class': 'modal' }),
			    bounce = true;
			if (config) {
				if (config.modalClass) {
					modal.addClass(config.modalClass);
				}
				if (config.noBounce) {
					bounce = false;
				}
			}
			modal.append(template);
			UI.el.body.append(modal);
			modal.focus();
			switchKeyListener(true);
			setShowing(true);
			setTimeout(function () {
				modal.css('opacity', 1);
				if (bounce) {
					Anim.bounceInDown($(".new-form"));
				}
			}, 1);
			if (callback) {
				callback();
			}
		}, delay);
	};

	var remove = function remove() {
		var modal = $('#modal');
		modal.css('opacity', '');
		setShowing(false);
		setTimeout(function () {
			modal.remove();
			switchKeyListener(false);
		}, 301);
	};

	var showImageViewer = function showImageViewer(imageURL) {
		var imageViewer = '<img class="image-viewer centered-transform" src="' + imageURL + '">',
		    config = {
			modalClass: 'modal--closable',
			noBounce: true
		};
		Modal.show(imageViewer, false, config);
	};
	var showGalleryViewer = function showGalleryViewer(imageURL) {
		console.log(imageURL);
		var imageViewer = '<div style="align-items: center;\n\t\t\t\tdisplay: flex;\n\t\t\t\tjustify-content: center;\n\t\t\t\tmargin: 0;"><div class="carousel">\n\t\t\t\t<div class="buttons-container">\n\t\t\t\t<button id="left" class="gallery_btn">Prev</button>\n\t\t\t\t<button id="right" class="gallery_btn">Next</button>\n\t\t\t\t</div>\n\t\t\t<div class="image-container" id="imgs" style="">';
		for (var i = 0; i < imageURL.length; i++) {
			imageViewer += '<img\n\t\t\t\tsrc="' + imageURL[i] + '"\n\t\t\t\talt="second-image"\n\t\t\t\tstyle="object-fit: cover; width:300px;"\n\t\t\t/>';
		}
		imageViewer += '</div>\n\t\t\t</div></div>';
		var config = {
			modalClass: 'modal--closable',
			noBounce: true
		};
		Modal.show(imageViewer, false, config);
	};

	var handleKeyPress = function handleKeyPress(ev) {
		if (ev.which === 27) {
			remove();
		}
	};

	var switchKeyListener = function switchKeyListener(flag) {
		if (flag) {
			UI.el.body.on('keydown', handleKeyPress);
		} else {
			UI.el.body.off('keydown', handleKeyPress);
		}
	};
	var idx = 0;

	var IMG_CONTAINER_WIDTH = 300;
	var handleButtonClick = function handleButtonClick() {
		idx += -1;
		changeImage();
	};
	var handleRightButtonClick = function handleRightButtonClick() {
		idx += 1;
		changeImage();
	};
	var initListeners = function initListeners() {
		UI.el.body.on('click', '.modal--closable', function (ev) {
			console.log(ev.target.className);
			if (ev.target.className != 'gallery_btn') {
				Modal.remove();
			}
		});
		UI.el.body.on('click', '#left', handleButtonClick);
		UI.el.body.on('click', '#right', handleRightButtonClick);
	};
	function changeImage() {
		var imgs = $('#imgs');
		var img = $("#imgs").find('img');
		console.log(idx, 'check', img);
		if (idx > img.length - 1) idx = 0;else if (idx < 0) idx = img.length - 1;

		imgs.css('transform', 'translateX(' + -idx * IMG_CONTAINER_WIDTH + 'px)');
	}

	// Exports
	return {
		show: show,
		remove: remove,
		showImageViewer: showImageViewer,
		showGalleryViewer: showGalleryViewer,
		initListeners: initListeners,
		isShowing: isShowing
	};
})();
/* global
 $,
 is,
 El,
 UI,
 Anim,
 Mustache,
 Comments,
 Channels,
 Subreddits,
 Menu,
 CurrentSelection,
 Sorting,
 URLs
 */

'use strict';

var Posts = (function () {

	var template = '\n\t\t{{#children}}\n\t\t\t<article class=\'link-wrap flx w-100\' id=\'{{data.name}}\'>\n\t\t\t\t<div class=\'link flx no-ndrln pad-y pad-x js-link\' data-id=\'{{data.id}}\'>\n\t\t\t\t\t<div class=\'link-thumb\'>\n\t\t\t\t\t\t<div style=\'background-image: url({{data.thumbnail}})\'></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\'link-info\'>\n\t\t\t\t\t\t<p\n\t\t\t\t\t\t   data-id=\'{{data.id}}\'\n\t\t\t\t\t\t   class=\'link-title no-ndrln blck js-post-title\'>\n\t\t\t\t\t\t{{data.title}}\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<div class=\'link-domain\'>{{data.domain}}</div>\n\t\t\t\t\t\t<span class=\'link-sub\'>{{data.subreddit}}</span>\n\t\t\t\t\t\t{{#data.over_18}}\n\t\t\t\t\t\t<span class=\'link-label txt-bld nsfw\'>NSFW</span>\n\t\t\t\t\t\t{{/data.over_18}}\n\t\t\t\t\t\t{{#data.stickied}}\n\t\t\t\t\t\t<span class=\'link-label txt-bld stickied\'>Stickied</span>\n\t\t\t\t\t\t{{/data.stickied}}\n\t\t\t\t\t\t<p class="tagline ">\n\t\t\t\t\t\t\tsubmitted \n\t\t\t\t\t\t\t<time title="{{data.unix_time}}" class="live-timestamp">\n\t\t\t\t\t\t\t\t{{data.time_ago}} ({{data.timestamp}})\n\t\t\t\t\t\t\t</time> by \n\t\t\t\t\t\t\t<a href="https://old.reddit.com/user/slvrfn" class="author may-blank id-t2_o61cy">\n\t\t\t\t\t\t\t{{data.author}}\n\t\t\t\t\t\t\t</a>\n\t\t\t\t\t\t\t<span class="userattrs"></span>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class="tagline ">\n\t\t\t\t\t\t\t<a href="{{data.url}}" data-event-action="comments" class="bylink comments may-blank" rel="nofollow">{{data.comments}}</a>\n\t\t\t\t\t\t\t<a href="#">save</a>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<a href=\'#comments:{{data.id}}\' class=\'to-comments w-15 flx flx-cntr-y btn-basic\'>\n\t\t\t\t\t<div class=\'comments-icon\'></div>\n\t\t\t\t</a>\n\t\t\t</article>\n\t\t{{/children}}\n\t\t<button id=\'btn-load-more-posts\'\n\t\t\t\tclass=\'btn blck mrgn-cntr-x\'>More</button>\n\t\t<div id=\'main-overflow\'></div>';

	var loading = false,
	    list = {},
	    loaded = {},
	    idLast = '';

	var el = {
		moreButton: function moreButton() {
			return $('#btn-load-more-posts');
		}
	};

	var getList = function getList() {
		return list;
	};

	var getLoaded = function getLoaded() {
		return loaded;
	};

	var setLoading = function setLoading(newLoading) {
		loading = newLoading;
	};

	var areLoading = function areLoading() {
		return loading;
	};

	var open = function open(url, id) {
		var link = list[id];
		if (link.self || is.wideScreen) {
			Comments.updateHash(id);
		} else {
			triggerClick(url);
		}
	};

	var load = function load(baseUrl, paging, regex) {
		if (loading) {
			return;
		}

		loading = true;

		Comments.setLoading(false);
		Subreddits.setEditing(false);

		var main = UI.el.mainWrap;

		if (paging) {
			el.moreButton().remove(); // remove current button
			main.append(UI.template.loader);
		} else {
			UI.el.mainWrap[0].scrollTop = 0; // to container top
			setTimeout(function () {
				main.prepend(UI.template.loader);
			}, Menu.isShowing() ? 301 : 1);
			paging = ''; // empty string, to avoid pagination
		}
		$.ajax({
			dataType: 'jsonp',
			url: baseUrl + Sorting.get() + URLs.limitEnd + paging,
			success: function success(result) {
				console.log(regex, 'check');
				if (regex) {
					if (regex.length > 1) {
						var filteredPosts = result;
						var postresAry = result.data.children;
						for (var w = 0; w < regex.length; w++) {
							var regexData = new RegExp(regex[w], 'i');
							var postres = postresAry.filter(function (post) {
								return regexData.test(post.data.title);
							});
							console.log(postres, regex[w]);
							postresAry = postres;
							// for (var e = 0; e < postres.length; e++) {
							// 	postresAry.push(postres[e]);
							// }
						}
						filteredPosts.data.children = postresAry;
						show(filteredPosts, paging);
					} else {
						var regexData = new RegExp(regex, 'i');
						var filteredPosts = result;
						filteredPosts.data.children = result.data.children.filter(function (post) {
							return regexData.test(post.data.title);
						});
						show(filteredPosts, paging);
					}
				} else {
					show(result, paging);
				}
			},
			error: function error() {
				loading = false;
				$('.loader').addClass("loader-error").text('Error loading links. Refresh to try again.');
			}
		});
	};

	var loadFromManualInput = function loadFromManualInput(loadedLinks) {
		show(loadedLinks);
		UI.el.mainWrap[0].scrollTop = 0;
		Subreddits.setEditing(false);
	};

	var render = function render(links, paging) {
		// links: API raw data
		var modifiedLinks = links;
		var childrens = [];
		var comments = Store.getItem("comments");
		if (comments) {
			comments = JSON.parse(comments);
		}
		for (var i = 0; i < links.children.length; i++) {
			var linkChild = links.children[i];
			var firstLoadedComment = "";
			if (comments) {
				firstLoadedComment = comments.filter(function (obj) {
					return obj.id === links.children[i].data.name;
				});
				if (firstLoadedComment.length > 0) {
					firstLoadedComment = " (" + firstLoadedComment[0].count.split(" ")[0] + ")";
				}
			}
			Object.assign(linkChild.data, {
				time_ago: timeAgo(links.children[i].data.created_utc),
				unix_time: unixTime(links.children[i].data.created_utc),
				timestamp: timestamp(links.children[i].data.created_utc),
				comments: links.children[i].data.num_comments == 1 ? "comment" + firstLoadedComment : links.children[i].data.num_comments + " comments" + firstLoadedComment
			});
			childrens.push(linkChild);
		}
		modifiedLinks.children = childrens;
		var linksCount = links.children.length,
		    main = UI.el.mainWrap;

		if (paging) {
			$(".loader").remove();
		} else {
			if (is.desktop) {
				main.empty();
			} else {
				main.empty().removeClass("anim-reveal").addClass(UI.classes.invisible);
			}
		}

		if (linksCount === 0) {
			var message = $('.loader');
			if (message) {
				message.text('No Links available.').addClass('loader-error');
				main.append('<div id="#main-overflow"></div>');
			} else {
				main.prepend('<div class="loader loader-error">No Links available.</div><div id="main-overflow"></div>');
			}
		} else {
			// Add new links to the list
			var compiledHTML = Mustache.to_html(template, modifiedLinks);
			// http -> relative in post thumbnails
			// searches and replaces 'url(http' to make sure it's only the thumbnail urls
			var httpsHTML = compiledHTML.replace(/url\(http\:/g, 'url(');
			main.append(httpsHTML);

			// Remove thumbnail space for those links with invalid backgrounds.
			var thumbnails = $('.link-thumb > div');

			// Remove the thumbnail space if post has no thumbnail
			// TODO: parse API json data to make this DOM manipulation not needed
			for (var _i = 0; _i < thumbnails.length; _i++) {
				var thumbnail = $(thumbnails[_i]);
				var backgroundImageStyle = thumbnail.attr('style').replace("background-image: ", "");

				if (backgroundImageStyle === 'url()' || backgroundImageStyle === 'url(default)' || backgroundImageStyle === 'url(nsfw)' || backgroundImageStyle === 'url(image)' || backgroundImageStyle === 'url(spoiler)' || backgroundImageStyle === 'url(self)') {
					// thumbnail.parent().remove();
					if (backgroundImageStyle === 'url(self)') {
						thumbnail[0].style.backgroundImage = "url(https://www.redditstatic.com/sprite-reddit.vSUv8UUCI2g.png)";
						thumbnail[0].style.backgroundPosition = "-5px -444px";
					} else if (backgroundImageStyle === 'url(default)') {
						thumbnail[0].style.backgroundImage = "url(https://www.redditstatic.com/sprite-reddit.vSUv8UUCI2g.png)";
						thumbnail[0].style.backgroundPosition = "-5px -225px";
					} else if (backgroundImageStyle === 'url(spoiler)') {
						thumbnail[0].style.backgroundImage = "url(https://www.redditstatic.com/sprite-reddit.vSUv8UUCI2g.png)";
						thumbnail[0].style.backgroundPosition = "-5px -371px";
					} else if (backgroundImageStyle === 'url(image)') {
						thumbnail[0].style.backgroundImage = "url(https://www.redditstatic.com/sprite-reddit.vSUv8UUCI2g.png)";
						thumbnail[0].style.backgroundPosition = "-5px -152px";
					} else if (backgroundImageStyle === 'url(nsfw)') {
						thumbnail[0].style.backgroundImage = "url(https://www.redditstatic.com/sprite-reddit.vSUv8UUCI2g.png)";
						thumbnail[0].style.backgroundPosition = "-5px -298px";
					}
				}
			}
			var discards = localStorage.getItem('discards');
			if (discards) {
				discards = JSON.parse(discards);
				for (var j = 0; j < discards.length; j++) {
					$("#" + discards[j]).css('display', 'none');
				}
			}
		}

		if (linksCount < 30) {// Remove 'More links' button if there are less than 30 links
			// el.moreButton().remove();
		}

		if (!is.desktop) {
			UI.scrollFixLinks();
		}

		if (!paging) {
			Anim.reveal(main);
		}

		if (!is.largeScreen) {
			UI.el.mainWrap.focus();
		}
	};

	var show = function show(result, paging) {
		var posts = result.data;
		loading = false;
		idLast = posts.after;

		setList(posts);
		render(posts, paging);

		if (is.wideScreen) {
			var id = Comments.getIdFromHash();
			if (id) {
				markSelected(id);
			}
		}
	};

	var setList = function setList(posts) {
		for (var i = 0; i < posts.children.length; i++) {
			var post = posts.children[i];
			if (list[post.data.id]) {
				// if already cached
				list[post.data.id].num_comments = post.data.num_comments;
				list[post.data.id].created_utc = post.data.created_utc;
			} else {
				// if not yet cached
				list[post.data.id] = {
					title: post.data.title,
					encodedTitle: encodeURI(post.data.title),
					selftext: post.data.selftext,
					created_utc: post.data.created_utc,
					domain: post.data.domain,
					name: post.data.name,
					subreddit: post.data.subreddit,
					num_comments: post.data.num_comments,
					url: post.data.url,
					self: post.data.is_self,
					link: post.data.permalink,
					author: post.data.author,
					preview: post.data.preview,
					is_gallery: post.data.is_gallery,
					media: post.data.media,
					secure_media: post.data.secure_media,
					media_metadata: post.data.media_metadata,
					gallery_data: post.data.gallery_data,
					over_18: post.data.over_18,
					stickied: post.data.stickied
				};
			}
		}
	};

	var refreshStream = function refreshStream() {
		if (Subreddits.isEditing()) {
			return;
		}
		var currentSelection = localStorage.getItem('currentSelection');
		currentSelection = JSON.parse(currentSelection);
		var subs = localStorage.getItem("subreeddits");
		var results = "";
		var reg = "";
		if (subs) {
			subs = JSON.parse(subs);
			results = subs.filter(function (item) {
				return item.subreddit.toLowerCase() === currentSelection.name.toLowerCase();
			});
			if (results.length > 0) {
				if (currentSelection.name.toLowerCase() === 'frontpage') {
					var regexAry = [];
					for (var r = 0; r < subs.length; r++) {
						regexAry.push(subs[r].regex);
					}
					reg = regexAry;
				} else {
					reg = [results[0].regex];
				}
			}
		}
		CurrentSelection.execute(function () {
			// if it's subreddit
			if (CurrentSelection.getName().toLowerCase() === 'frontpage') {
				load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/", "", reg); // fourth parameter: regex ignore
			} else {
					load(URLs.init + "r/" + CurrentSelection.getName() + "/", "", reg);
				}
		}, function () {
			// if it's channel
			Channels.loadPosts(Channels.getByName(CurrentSelection.getName()));
		});
	};

	var markSelected = function markSelected(id) {
		$(".link.link-selected").removeClass("link-selected");
		$('.link[data-id="' + id + '"]').addClass('link-selected');
	};

	var clearSelected = function clearSelected() {
		$('.link.link-selected').removeClass('link-selected');
	};

	var triggerClick = function triggerClick(url) {
		var a = document.createElement('a');
		a.setAttribute("href", url);
		a.setAttribute("target", "_blank");

		var clickEvent = new MouseEvent("click", {
			"view": window,
			"bubbles": true,
			"cancelable": false
		});

		a.dispatchEvent(clickEvent);
	};

	var initListeners = function initListeners() {

		UI.el.mainWrap.on('click', '.js-link', function (ev) {
			// ev.preventDefault();

			if (!is.wideScreen) {
				return;
			}

			Comments.updateHash(this.dataset.id);
		});

		UI.el.mainWrap.on('click', '.js-post-title', function (ev) {
			ev.preventDefault();

			var id = ev.target.dataset.id,
			    url = ev.target.href;

			open(url, id);
		});

		UI.el.mainWrap.on('click', '#btn-load-more-posts', function () {
			CurrentSelection.execute(function () {
				var url;
				if (CurrentSelection.getName().toLowerCase() === 'frontpage') {
					url = URLs.init + 'r/' + Subreddits.getAllSubsString() + '/';
				} else {
					url = URLs.init + 'r/' + CurrentSelection.getName() + '/';
				}
				load(url, '&after=' + idLast);
			}, function () {
				var channel = Channels.getByName(CurrentSelection.getName());
				load(URLs.init + Channels.getURL(channel) + '/', '&after=' + idLast);
			});
		});
	};
	var timeAgo = function timeAgo(utcTimestamp) {
		var now = new Date().getTime();
		var timeDifference = now - utcTimestamp * 1000; //convert unix timestamp to milliseconds
		var differenceInSeconds = Math.floor(timeDifference / 1000);

		if (differenceInSeconds < 60) {
			return "Just now";
		} else if (differenceInSeconds / 60 < 60) {
			return Math.floor(differenceInSeconds / 60) + " minutes ago";
		} else if (differenceInSeconds / 3600 < 24) {
			return Math.floor(differenceInSeconds / 3600) + " hours ago";
		} else {
			return Math.floor(differenceInSeconds / 86400) + " days ago";
		}
	};
	var unixTime = function unixTime(_unixTime) {
		var date = new Date(_unixTime * 1000);

		var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		var formattedDate = dayNames[date.getUTCDay()] + ' ' + monthNames[date.getUTCMonth()] + ' ' + String(date.getUTCDate()).padStart(2, '0') + ' ' + String(date.getUTCHours()).padStart(2, '0') + ':' + String(date.getUTCMinutes()).padStart(2, '0') + ':' + String(date.getUTCSeconds()).padStart(2, '0') + ' ' + date.getUTCFullYear() + ' UTC';
		return formattedDate;
	};
	var timestamp = function timestamp(unix_timestamp) {
		var date = new Date(unix_timestamp * 1000);
		var year = date.getUTCFullYear();
		var month = date.getUTCMonth() + 1; // JavaScript starts counting months from 0.
		var day = date.getUTCDate();
		var hours = date.getUTCHours();
		var minutes = date.getUTCMinutes();
		var seconds = date.getUTCSeconds();
		var formattedTime = hours + ':' + minutes + ':' + seconds + ' ' + year + '-' + month + '-' + day;
		return formattedTime;
	};
	// Exports
	return {
		initListeners: initListeners,
		load: load,
		clearSelected: clearSelected,
		refreshStream: refreshStream,
		markSelected: markSelected,
		loadFromManualInput: loadFromManualInput,
		setLoading: setLoading,
		areLoading: areLoading,
		getList: getList,
		setList: setList,
		timeAgo: timeAgo,
		unixTime: unixTime,
		timestamp: timestamp,
		getLoaded: getLoaded
	};
})();
/* global
 Sorting,
 Posts,
 */

'use strict';

var SortSwitch = (function () {

	// Initial State
	var isHot = true;

	var classes = {
		'new': 'sort-switch--new'
	};

	var wrap = '';

	var el = {
		getWrap: function getWrap() {
			if (!wrap) {
				wrap = document.getElementsByClassName('sorter-wrap')[0];
			}
			return wrap;
		},
		mainSwitch: $('.js-sort-switch-main')
	};

	var initListeners = function initListeners() {
		el.mainSwitch.on('click', function (ev) {
			ev.preventDefault();
			var target = this;
			if (Posts.areLoading()) {
				return;
			}
			isHot = !isHot;
			Sorting.change(isHot ? 'hot' : 'new');
			if (isHot) {
				target.classList.remove(classes['new']);
			} else {
				target.classList.add(classes['new']);
			}
		});
	};

	// Exports
	return {
		el: el,
		initListeners: initListeners
	};
})();
/* global
 Menu,
 Posts,
 UI
 */

'use strict';

var Sorting = (function () {

	var current = 'hot';

	var get = function get() {
		return current !== 'hot' ? current + '/' : '';
	};

	var change = function change(sorting) {
		current = sorting;
		var delay = 1;
		if (Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function () {
			Posts.refreshStream();
		}, delay);
	};

	// Exports
	return {
		get: get,
		change: change
	};
})();
/* global
 $,
 $$,
 Store,
 Mustache,
 CurrentSelection,
 UI,
 El,
 Menu,
 Anim,
 Footer,
 SortSwitch,
 is,
 Modal,
 Posts,
 Channels,
 Backup,
 Sorting,
 URLs
 */

"use strict";

var Subreddits = (function () {

	var defaults = [{
		"subreddit": "frontPage",
		"regex": "f"
	}, {
		"subreddit": "all",
		"regex": "a"
	}, {
		"subreddit": "pics",
		"regex": "p"
	}, {
		"subreddit": "tech",
		"regex": "t"
	}, {
		"subreddit": "cryptocurrencies",
		"regex": "crypto"
	}],
	    list = [],
	    idLast = '',
	    editing = false,
	    loadedSubs;

	var subredditClasses = 'sub pad-x pad-y blck no-ndrln txt-cap txt-ellps';

	var template = {
		list: "{{#.}}<a href='#{{subreddit}}' data-name='{{subreddit}}' class='" + subredditClasses + "'>{{subreddit}}</a>{{/.}}",
		toEditList: "<div class='edit-subs-title pad-x pad-y txt-bld txt-cntr'>Subreddits</div><ul class='no-mrgn no-pad'>{{#.}}<div class='item-to-edit flx sub-to-remove' data-name='{{subreddit}}'><p class='sub-name w-85 txt-cap txt-bld'>{{subreddit}} (regex: {{regex}})</p><a href='#edit_sub' rid='{{subreddit}}' class='flx flx-cntr-x flx-cntr-y w-15 no-ndrln clr-current btn-edit-sub icon-pencil'></a><a href='#remove' class='no-ndrln clr-current flx flx-cntr-x flx-cntr-y w-15 btn-remove-sub icon-trashcan' data-name='{{subreddit}}'></a></div>{{/.}}</ul>",
		toAddList: "{{#children}}<div class='sub-to-add flx w-100'><div class='w-85'><p class='sub-to-add__title js-sub-title txt-bld'>{{data.display_name}}</p><p class='sub-to-add__description'>{{data.public_description}}</p></div><a href='#add' class='btn-add-sub no-ndrln flx flx-cntr-x flx-cntr-y w-15 icon-plus-circle'></a></div>{{/children}}",
		loadMoreSubsButton: "<button class='btn blck w-50 mrgn-y mrgn-cntr-x' id='btn-more-subs'>More</button>",
		formInsert: "<div class=\"new-form\" id=\"form-new-sub\"><div class=\"form-left-corner\"><button class=\"btn\" id=\"btn-add-new-sub\">Add Subreddit</button></div>" + UI.template.closeModalButton + "<form><input type=\"text\" id=\"txt-new-sub\" placeholder=\"New subreddit name\" /><input type=\"text\" id=\"txt-new-reg\" placeholder=\"Regex\" style=\"margin-top: 10px;\" /></form></div>",
		formUpdate: "<div class=\"new-form\" id=\"form-update-sub\"><div class=\"form-left-corner\"><button class=\"btn\" id=\"btn-update-new-sub\">Update Subreddit</button></div>" + UI.template.closeModalButton + "<form><input type=\"text\" id=\"txt-update-sub\" placeholder=\"Subreddit name\" /><input type=\"text\" id=\"txt-update-reg\" placeholder=\"Regex\" style=\"margin-top: 10px;\" /></form></div>",
		topButtonsForAdding: "<div class='flx flx-cntr-x pad-x pad-y'><button id='btn-sub-man' class='btn group-btn'>Insert Manually</button><button id='btn-add-channel' class='btn group-btn'>Create Channel</button></div>"
	};

	var el = {
		list: $("#subs")
	};

	var getList = function getList() {
		return list;
	};

	var isEditing = function isEditing() {
		return editing;
	};

	var insert = function insert(sub, reg) {
		list.push({
			"subreddit": sub,
			"regex": reg
		});
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function _delete(sub) {
		var idx = list.findIndex(function (obj) {
			return obj.subreddit === sub;
		});
		list.splice(idx, 1);
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var append = function append(subs) {
		if (subs instanceof Array) {
			el.list.append(Mustache.to_html(template.list, subs));
		} else {
			el.list.append($("<a/>").attr({ 'data-name': subs, 'href': '#' }).addClass(subredditClasses).text(subs));
		}
		var comments = localStorage.getItem('archives_comments');
		var archiveListSubreddit = [];
		var aSubredditDom = "";
		if (comments) {
			comments = JSON.parse(comments);
			for (var ca = 0; ca < comments.length; ca++) {
				var cSubreddit = comments[ca].subreddit.charAt(0).toUpperCase() + comments[ca].subreddit.slice(1);
				if (archiveListSubreddit.indexOf(cSubreddit) == -1) {
					archiveListSubreddit.push(cSubreddit);
					aSubredditDom += "<a href='#' class='cSub pad-x pad-y blck no-ndrln txt-cap txt-ellps' rid='" + comments[ca].subreddit + "'>" + cSubreddit + "</a>";
				}
			}
		}
		$("#archive_subs").html(aSubredditDom);
	};

	var detach = function detach(sub) {
		var deletedSub = $(".sub-to-remove[data-name='" + sub + "']");
		deletedSub.addClass("anim-delete");
		setTimeout(function () {
			deletedSub.remove();
		}, 200);

		el.list.find(".sub[data-name=" + sub + "]").remove();
	};

	var setList = function setList(subs) {
		list = subs;
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var listHasSub = function listHasSub(newSub) {
		if (list) {
			newSub = newSub.toLowerCase();
			for (var i = list.length; --i;) {
				var sub = list[i].subreddit;
				if (sub.toLowerCase() === newSub) {
					return true;
				}
			}
			return false;
		}
		return false;
	};

	var getAllSubsString = function getAllSubsString() {
		var allSubs = '',
		    frontPage = 'frontpage',
		    all = 'all';
		for (var i = 0; i < list.length; i++) {
			var sub = list[i].subreddit.toLowerCase();
			if (sub === frontPage || sub === all) {
				continue;
			}
			allSubs += sub + '+';
		}
		return allSubs.substring(0, allSubs.length - 1);
	};

	var loadSaved = function loadSaved(subredditsData) {
		// Only should execute when first loading the app
		var subs = Store.getItem("subreeddits");
		if (subs) {
			subs = JSON.parse(subs);
		}
		list = subs;
		if (!list) {
			// If it hasn't been loaded to the 'local Store', save defaults subreddits
			setList(subredditsData);
		}
		append(list);
	};

	var loadPosts = function loadPosts(sub) {
		var results = list.filter(function (item) {
			return item.subreddit.toLowerCase() === sub.toLowerCase();
		});
		console.log(sub, 'checking--', results, editing);
		if (1) {
			// if (sub !== CurrentSelection.getName() || editing) {
			var url;
			if (sub.toLowerCase() === 'frontpage') {
				url = URLs.init + "r/" + getAllSubsString() + "/";
			} else {
				url = URLs.init + "r/" + sub + "/";
			}
			if (results.length > 0) {
				if (sub.toLowerCase() === 'frontpage') {
					var regexAry = [];
					for (var r = 0; r < list.length; r++) {
						regexAry.push(list[r].regex);
					}
					Posts.load(url, "", regexAry);
				} else {
					Posts.load(url, "", [results[0].regex]);
				}
			} else {
				Posts.load(url, "", "");
			}
			CurrentSelection.setSubreddit(sub);
		}
		UI.setSubTitle(sub);
	};

	var remove = function remove(sub) {
		_delete(sub);
		detach(sub);
		if (CurrentSelection.getType() === CurrentSelection.Types.SUB && CurrentSelection.getName() === sub) {
			// If it was the current selection
			CurrentSelection.setSubreddit(defaults[0].subreddit);
		}
	};

	var add = function add(newSub, regex) {
		if (listHasSub(newSub)) {
			return;
		}
		insert(newSub, regex);
		append(newSub);
	};
	var update = function update(newSub, regex) {
		var originalSub = localStorage.getItem("update_sub");
		// if (listHasSub(newSub)) {
		// 	return;
		// }
		_delete(originalSub);
		detach(originalSub);
		insert(newSub, regex);
		append(newSub);
		localStorage.removeItem('update_sub');
	};

	var addFromNewForm = function addFromNewForm() {
		var txtSub = $$.id("txt-new-sub"),
		    subName = txtSub.value;
		var txtReg = $("#txt-new-reg").val();
		if (!subName) {
			txtSub.setAttribute("placeholder", "Enter a subreddit title!");
			Anim.shakeForm();
			return;
		}
		if (listHasSub(subName)) {
			txtSub.value = "";
			txtSub.setAttribute("placeholder", subName + " already added!");
			Anim.shakeForm();
			return;
		}

		subName = subName.trim();

		Anim.bounceOut($(".new-form"), Modal.remove);

		$.ajax({
			url: URLs.init + "r/" + subName + "/" + Sorting.get() + URLs.limitEnd,
			dataType: 'jsonp',
			success: function success(data) {
				if (txtReg) {
					var regexData = new RegExp(txtReg, 'i');
					var filteredPosts = data;
					filteredPosts.data.children = data.data.children.filter(function (post) {
						return regexData.test(post.data.title);
					});
					Posts.loadFromManualInput(filteredPosts);
				} else {
					Posts.loadFromManualInput(data);
				}
				UI.setSubTitle(subName);
				CurrentSelection.setSubreddit(subName);
				add(subName, txtReg);
				Menu.markSelected({
					name: subName,
					update: true
				});
			},
			error: function error() {
				alert('Oh, the subreddit you entered is not valid...');
			}
		});
	};
	var updateFromNewForm = function updateFromNewForm() {
		var txtSub = $$.id("txt-update-sub"),
		    subName = txtSub.value;
		var txtReg = $("#txt-update-reg").val();
		if (!subName) {
			txtSub.setAttribute("placeholder", "Enter a subreddit title!");
			Anim.shakeForm();
			return;
		}
		// if (listHasSub(subName)) {
		// 	txtSub.value = "";
		// 	txtSub.setAttribute("placeholder", subName + " already added!");
		// 	Anim.shakeForm();
		// 	return;
		// }

		subName = subName.trim();

		Anim.bounceOut($(".new-form"), Modal.remove);

		$.ajax({
			url: URLs.init + "r/" + subName + "/" + Sorting.get() + URLs.limitEnd,
			dataType: 'jsonp',
			success: function success(data) {
				if (txtReg) {
					var regexData = new RegExp(txtReg, 'i');
					var filteredPosts = data;
					filteredPosts.data.children = data.data.children.filter(function (post) {
						return regexData.test(post.data.title);
					});
					Posts.loadFromManualInput(filteredPosts);
				} else {
					Posts.loadFromManualInput(data);
				}
				UI.setSubTitle(subName);
				CurrentSelection.setSubreddit(subName);
				// add(subName, txtReg);
				update(subName, txtReg);
				Menu.markSelected({
					name: subName,
					update: true
				});
			},
			error: function error() {
				alert('Oh, the subreddit you entered is not valid...');
			}
		});
	};

	var setEditing = function setEditing( /* boolean */newEditing) {
		if (newEditing === editing) {
			return;
		}
		editing = newEditing;
		if (is.wideScreen) {
			UI.switchDisplay(Footer.el.getRefreshButton(), newEditing);
			UI.switchDisplay(SortSwitch.el.getWrap(), newEditing);
		}
	};

	var loadForAdding = function loadForAdding() {
		if (!is.largeScreen) {
			Menu.move(UI.Move.LEFT);
		}
		if (UI.getCurrentView() === UI.View.COMMENTS) {
			UI.backToMainView();
		}

		setTimeout(function () {
			UI.el.mainWrap[0].scrollTop = 0; // Go to the container top
			var main = UI.el.mainWrap;
			if (loadedSubs) {
				main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
			} else {
				main.prepend(UI.template.loader).prepend(template.topButtonsForAdding);
				$.ajax({
					url: URLs.init + "reddits/.json?limit=50&jsonp=?",
					dataType: 'jsonp',
					success: function success(list) {
						idLast = list.data.after;
						loadedSubs = Mustache.to_html(template.toAddList, list.data);
						main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
					},
					error: function error() {
						$('.loader').addClass("loader-error").text('Error loading subreddits.');
					}
				});
			}
			Posts.setLoading(false);
		}, is.largeScreen ? 1 : 301);
		Menu.cleanSelected();
		UI.setSubTitle("Add Subs");
		setEditing(true);
	};

	var loadForEditing = function loadForEditing() {
		if (!is.largeScreen) {
			Menu.move(UI.Move.LEFT);
		}
		if (UI.getCurrentView() === UI.View.COMMENTS) {
			UI.backToMainView();
		}

		setTimeout(function () {
			UI.el.mainWrap[0].scrollTop = 0; // Up to container top
			var htmlSubs = Mustache.to_html(template.toEditList, list);
			var htmlChannels = '',
			    channelsList = Channels.getList();

			if (channelsList && channelsList.length > 0) {
				htmlChannels = Mustache.to_html("<div class='edit-subs-title pad-x pad-y txt-bld txt-cntr'>Channels</div><ul class='no-mrgn no-pad channel-edit-list'>{{#.}} " + Channels.template.singleEditItem + "{{/.}}</ul>", channelsList);
			}

			var html = '<div class="h-100">' + htmlChannels + htmlSubs + "</div>";
			setTimeout(function () {
				// Intentional delay / fix for iOS
				UI.el.mainWrap.html(html);
			}, 10);

			Menu.cleanSelected();
			Posts.setLoading(false);
		}, is.largeScreen ? 1 : 301);

		UI.setSubTitle('Edit Subs');
		setEditing(true);
	};

	var initListeners = function initListeners() {

		// New Subreddit Form
		UI.el.body.on('submit', '#form-new-sub form', function (e) {
			e.preventDefault();
			addFromNewForm();
		});
		UI.el.body.on('submit', '#form-update-sub form', function (e) {
			e.preventDefault();
			updateFromNewForm();
		});

		UI.el.body.on('click', "#btn-add-new-sub", addFromNewForm);
		UI.el.body.on('click', "#btn-update-new-sub", updateFromNewForm);
		UI.el.body.on('click', ".cSub", function () {
			var id = $(this).attr("rid");
			$(".sub--selected").removeClass('sub--selected');
			$(this).addClass('sub--selected');
			var archives_comments = localStorage.getItem('archives_comments');
			if (archives_comments) {
				archives_comments = JSON.parse(archives_comments);
				var archives_comments_match = archives_comments.filter(function (item) {
					return item.subreddit.toLowerCase() === id.toLowerCase();
				});
				console.log(archives_comments_match);
				var archives = localStorage.getItem('archives');
				var archiveDom = "";
				if (archives) {
					archives = JSON.parse(archives);
					for (var p = 0; p < archives_comments_match.length; p++) {
						for (var o = 0; o < archives.length; o++) {
							var str = archives[o];
							if (str.indexOf(archives_comments_match[p].id) > -1) {
								str = str.replace("link-selected", "");
								archiveDom += str;
							}
						}
					}
				}
				$("#main-wrap").html(archiveDom);
			}
		});
		//

		UI.el.body.on('click', "#btn-add-another-sub", function () {
			var container = $("#subs-for-channel");
			container.append("<input type='text' placeholder='Extra subreddit'/>");
			container[0].scrollTop = container.height();
		});

		UI.el.mainWrap.on('click', '#btn-sub-man', function () {
			Modal.show(template.formInsert);
		});
		UI.el.mainWrap.on('click', '.link-wrap', function () {
			$(".main-view").removeClass("show-view");
			$(".detail-view").addClass("show-view");
		});
		UI.el.mainWrap.on('click', '.btn-edit-sub', function () {
			var originalSubreddit = $(this).attr('rid');
			var originalResult = list.filter(function (item) {
				return item.subreddit.toLowerCase() === originalSubreddit.toLowerCase();
			});
			var originalRegex = originalResult[0].regex;
			Modal.show(template.formUpdate);
			setTimeout(function () {
				localStorage.setItem("update_sub", originalSubreddit);
				$('#txt-update-sub').val(originalSubreddit);
				$('#txt-update-reg').val(originalRegex);
			}, 500);
		});

		UI.el.mainWrap.on('click', '#btn-more-subs', function (ev) {
			var target = ev.target;
			$(target).remove();
			var main = UI.el.mainWrap;
			main.append(UI.template.loader);
			$.ajax({
				url: URLs.init + 'reddits/' + URLs.end + '&after=' + idLast,
				dataType: 'jsonp',
				success: function success(list) {
					var newSubs = Mustache.to_html(template.toAddList, list.data);
					idLast = list.data.after;
					$('.loader', main).remove();
					main.append(newSubs).append(template.loadMoreSubsButton);
					loadedSubs = loadedSubs + newSubs;
				},
				error: function error() {
					$('.loader').addClass('loader-error').text('Error loading more subreddits.');
				}
			});
		});

		UI.el.mainWrap.on('click', '.btn-add-sub', function (ev) {
			ev.preventDefault();
			var parent = $(this).parent(),
			    subTitle = $(".js-sub-title", parent);
			subTitle.css("color", "#2b9900"); // 'adding sub' little UI feedback
			var newSub = subTitle.text();
			add(newSub, "");
		});

		UI.el.mainWrap.on('click', '.btn-remove-sub', function (ev) {
			ev.preventDefault();
			remove(this.dataset.name);
		});
	};

	// Exports
	return {
		getList: getList,
		getAllSubsString: getAllSubsString,
		setEditing: setEditing,
		isEditing: isEditing,
		loadPosts: loadPosts,
		loadForEditing: loadForEditing,
		loadForAdding: loadForAdding,
		loadSaved: loadSaved,
		initListeners: initListeners,
		template: {
			formInsert: template.formInsert
		}
	};
})();
/* global
 El,
 UI,
 is
 */

"use strict";

var Anim = (function () {

	var slideFromLeft = function slideFromLeft() {
		var show = UI.classes.showView;
		UI.el.mainView.addClass(show);
		UI.el.detailView.removeClass(show);
		UI.setCurrentView(UI.View.MAIN);
	};

	var slideFromRight = function slideFromRight() {
		var show = UI.classes.showView;
		UI.el.mainView.removeClass(show);
		UI.el.detailView.addClass(show);
		UI.setCurrentView(UI.View.COMMENTS);
	};

	var reveal = function reveal(el) {
		var reveal = "anim-reveal";
		if (is.desktop) {
			el.addClass(reveal);
			setTimeout(function () {
				el.removeClass(reveal);
			}, 700);
		} else {
			setTimeout(function () {
				el.removeClass(UI.classes.invisible).addClass(reveal);
			}, 0);
		}
	};

	var shake = function shake(el) {
		var shake = "anim-shake";
		el.addClass(shake);
		setTimeout(function () {
			el.removeClass(shake);
		}, 350);
	};

	var shakeForm = function shakeForm() {
		shake($(".new-form"));
	};

	var bounceOut = function bounceOut(el, callback) {
		var bounceOut = "anim-bounce-out";
		el.addClass(bounceOut);
		if (callback) {
			setTimeout(callback, 1000);
		}
	};

	var bounceInDown = function bounceInDown(el) {
		el.addClass("anim-bounceInDown");
		setTimeout(function () {
			el[0].style.opacity = 1;
			el.removeClass("anim-bounceInDown");
		}, 500);
	};

	// Exports
	return {
		slideFromLeft: slideFromLeft,
		slideFromRight: slideFromRight,
		reveal: reveal,
		shake: shake,
		shakeForm: shakeForm,
		bounceOut: bounceOut,
		bounceInDown: bounceInDown
	};
})();
"use strict";

var $$ = {

	id: function id(query) {
		return document.getElementById(query);
	},

	q: function q(query) {
		return document.querySelector(query);
	}
};
"use strict";

var wideScreenBP = window.matchMedia("(min-width: 1000px)");
var largeScreenBP = window.matchMedia("(min-width: 490px)");
var UA = window.navigator.userAgent;

var is = (function () {

  // Do detection
  var isDesktop = !/iPhone|iPod|iPad|Android|Mobile/.test(UA);
  var isiPad = /iPad/.test(UA);
  var isiPhone = /iP(hone|od)/.test(UA);
  var isiOS = isiPhone || isiPad;

  var iOSversion = (function () {
    if (!isiOS) {
      return 0;
    }
    return parseInt(UA.match(/ OS (\d+)_/i)[1], 10);
  })();

  return {
    wideScreen: wideScreenBP.matches,
    largeScreen: largeScreenBP.matches,
    desktop: isDesktop,
    mobile: !isDesktop,
    iPhone: isiPhone,
    iPad: isiPad,
    iOS: isiOS,
    iOS7: isiOS && iOSversion >= 7
  };
})();
/* global allCookies */
"use strict";

var Store = window.fluid ? allCookies : window.localStorage;
/* global
 Store,
 UI,
 is
 */

'use strict';

var ThemeSwitcher = (function () {

	var themes = ['classic', 'light', 'dark'];

	var currentThemeIndex = 0;

	var el = {
		switcherButton: $('#switch-theme')
	};

	var switchTheme = function switchTheme() {
		var current = getCurrentTheme(),
		    next = getNextTheme();

		UI.el.body.removeClass(current);
		setTheme(next);
	};

	var setTheme = function setTheme(theme) {
		UI.el.body.addClass(theme);
		setThemeLabel(theme);
		saveTheme(theme);
	};

	var setThemeLabel = function setThemeLabel(name) {
		el.switcherButton.text('Theme: ' + name);
	};

	var getCurrentTheme = function getCurrentTheme() {
		return themes[currentThemeIndex];
	};

	var getNextTheme = function getNextTheme() {
		currentThemeIndex++;

		if (currentThemeIndex === themes.length) {
			currentThemeIndex = 0;
		}

		return themes[currentThemeIndex];
	};

	var saveTheme = function saveTheme(theme) {
		Store.setItem('theme', theme);
	};

	var loadTheme = function loadTheme() {
		return Store.getItem('theme');
	};

	var loadInitialTheme = function loadInitialTheme() {
		var initial = loadTheme();

		if (initial) {
			updateTheme(initial);
		} else if (is.iOS7) {
			setTheme(themes[1]);
		} else {
			setTheme(themes[currentThemeIndex]);
		}
	};

	var updateTheme = function updateTheme(theme) {
		if (getCurrentTheme() === theme) {
			return;
		}
		setTheme(theme);
		currentThemeIndex = themes.indexOf(theme);
	};

	var init = function init() {
		loadInitialTheme();
		// Listeners
		el.switcherButton.on('click', function (ev) {
			ev.preventDefault();
			switchTheme();
		});
	};

	// Exports
	return {
		init: init
	};
})();
'use strict';

var URLs = {
  init: 'https://www.reddit.com/',
  // init: `${window.location.protocol}//www.reddit.com/`,
  end: '.json?jsonp=?',
  limitEnd: '.json?limit=30&jsonp=?'
};
/* global
 $$,
 Store,
 El,
 is,
 Comments,
 Subreddits,
 Channels,
 Posts,
 Footer,
 Header,
 Menu,
 Modal,
 SortSwitch,
 CurrentSelection,
 UI,
 Backup,
 URLs,
 ThemeSwitcher,
 LinkSummary,
 FastClick
*/

// Init all modules listeners
"use strict";

UI.initListeners();
Posts.initListeners();
Comments.initListeners();
Subreddits.initListeners();
Channels.initListeners();
Menu.initListeners();
Header.initListeners();
Modal.initListeners();
SortSwitch.initListeners();
Backup.initListeners();
LinkSummary.initListeners();

Header.el.postTitle.remove();

if (is.wideScreen) {
	Footer.el.postTitle.text('');
}

CurrentSelection.loadSaved();

var initDefaults = [{
	"subreddit": "frontPage",
	"regex": "f"
}, {
	"subreddit": "all",
	"regex": "a"
}, {
	"subreddit": "pics",
	"regex": "p"
}, {
	"subreddit": "tech",
	"regex": "t"
}, {
	"subreddit": "cryptocurrencies",
	"regex": "crypto"
}];
var defaults = [];
var initSqlJs = window.initSqlJs;
var DB_NAME = 'reddit_db';
var initDb = function initDb() {
	return new Promise(function (resolve, reject) {
		initSqlJs({
			locateFile: function locateFile(file) {
				return "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.3.0/dist/" + file;
			}
		}).then(function (SQL) {
			var db = new SQL.Database();
			db.run("CREATE TABLE subreddits(subreddit text, regex text);");
			db.run("CREATE TABLE threads(id text);");
			for (var i = 0; i < initDefaults.length; i++) {
				var result = db.exec("SELECT * FROM subreddits WHERE subreddit='" + initDefaults[i].subreddit + "';");
				if (result.length == 0) {
					db.run("INSERT INTO subreddits VALUES ('" + initDefaults[i].subreddit + "', '" + initDefaults[i].regex + "');");
				}
			}
			db.run("INSERT INTO threads VALUES ('testid');");
			var subreddits = db.exec("SELECT * FROM subreddits;");
			if (subreddits.length > 0) {
				for (var j = 0; j < subreddits[0].values.length; j++) {
					defaults.push({
						"subreddit": subreddits[0].values[j][0],
						"regex": subreddits[0].values[j][1]
					});
				}
			}
			resolve(db);
		})["catch"](function (error) {
			reject(error);
		});
	});
};

initDb().then(function (db) {
	console.log("Database initialization successful.");
	Subreddits.loadSaved(defaults);
	console.log(defaults);
	Channels.loadSaved();

	if (location.hash) {
		Comments.navigateFromHash();
	}

	CurrentSelection.execute(function () {
		// If it's a subreddit
		var currentSubName = CurrentSelection.getName();
		Menu.markSelected({ name: currentSubName });

		var subs = localStorage.getItem("subreeddits");
		var results = "";
		var reg = "";
		if (subs) {
			subs = JSON.parse(subs);
			results = subs.filter(function (item) {
				return item.subreddit.toLowerCase() === currentSubName.toLowerCase();
			});
			if (results.length > 0) {
				if (currentSubName.toLowerCase() === 'frontpage') {
					var regexAry = [];
					for (var r = 0; r < subs.length; r++) {
						regexAry.push(subs[r].regex);
					}
					reg = regexAry;
				} else {
					reg = [results[0].regex];
				}
			}
		}

		// Load links
		if (currentSubName.toUpperCase() === 'frontPage'.toUpperCase()) {
			CurrentSelection.setSubreddit('frontPage');
			Posts.load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/", "", reg);
		} else {
			Posts.load(URLs.init + "r/" + currentSubName + "/", "", reg);
		}
		UI.setSubTitle(currentSubName);
	}, function () {
		// If it's a channel
		var channel = Channels.getByName(CurrentSelection.getName());
		Menu.markSelected({ type: 'channel', name: channel.name });
		Channels.loadPosts(channel);
	});

	ThemeSwitcher.init();

	if (is.mobile) {

		UI.scrollTop();

		var touch = 'touchmove';

		$$.id("edit-subs").addEventListener(touch, function (e) {
			e.preventDefault();
		}, false);

		document.getElementsByTagName('header')[0].addEventListener(touch, function (e) {
			if (Menu.isShowing()) {
				e.preventDefault();
			}
		}, false);

		if (is.iPad) {
			UI.iPadScrollFix();
		}

		if (is.iOS7) {
			document.body.classList.add("ios7");
		}
	}

	FastClick.attach(document.body);
})["catch"](function (error) {
	console.error("Error initializing database:", error);
});

// Subreddits.loadSaved();