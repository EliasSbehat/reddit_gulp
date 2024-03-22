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

var Subreddits = (function () {

	var defaults = [
		{
			"subreddit": "frontPage",
			"regex": "f"
		},
		{
			"subreddit": "all",
			"regex": "a"
		},
		{
			"subreddit": "pics",
			"regex": "p"
		},
		{
			"subreddit": "tech",
			"regex": "t"
		},
		{
			"subreddit": "cryptocurrencies",
			"regex": "crypto"
		}
	],
		list = [],
		idLast = '',
		editing = false,
		loadedSubs;

	const subredditClasses = 'sub pad-x pad-y blck no-ndrln txt-cap txt-ellps';

	var template = {
		list: "{{#.}}<a href='#{{subreddit}}' data-name='{{subreddit}}' class='" + subredditClasses + "'>{{subreddit}}</a>{{/.}}",
		toEditList: "<div class='edit-subs-title pad-x pad-y txt-bld txt-cntr'>Subreddits</div><ul class='no-mrgn no-pad'>{{#.}}<div class='item-to-edit flx sub-to-remove' data-name='{{subreddit}}'><p class='sub-name w-85 txt-cap txt-bld'>{{subreddit}} (regex: {{regex}})</p><a href='#edit_sub' rid='{{subreddit}}' class='flx flx-cntr-x flx-cntr-y w-15 no-ndrln clr-current btn-edit-sub icon-pencil'></a><a href='#remove' class='no-ndrln clr-current flx flx-cntr-x flx-cntr-y w-15 btn-remove-sub icon-trashcan' data-name='{{subreddit}}'></a></div>{{/.}}</ul>",
		toAddList: "{{#children}}<div class='sub-to-add flx w-100'><div class='w-85'><p class='sub-to-add__title js-sub-title txt-bld'>{{data.display_name}}</p><p class='sub-to-add__description'>{{data.public_description}}</p></div><a href='#add' class='btn-add-sub no-ndrln flx flx-cntr-x flx-cntr-y w-15 icon-plus-circle'></a></div>{{/children}}",
		loadMoreSubsButton: "<button class='btn blck w-50 mrgn-y mrgn-cntr-x' id='btn-more-subs'>More</button>",
		formInsert: `<div class="new-form" id="form-new-sub"><div class="form-left-corner"><button class="btn" id="btn-add-new-sub">Add Subreddit</button></div>${UI.template.closeModalButton}<form><input type="text" id="txt-new-sub" placeholder="New subreddit name" /><input type="text" id="txt-new-reg" placeholder="Regex" style="margin-top: 10px;" /></form></div>`,
		formUpdate: `<div class="new-form" id="form-update-sub"><div class="form-left-corner"><button class="btn" id="btn-update-new-sub">Update Subreddit</button></div>${UI.template.closeModalButton}<form><input type="text" id="txt-update-sub" placeholder="Subreddit name" /><input type="text" id="txt-update-reg" placeholder="Regex" style="margin-top: 10px;" /></form></div>`,
		topButtonsForAdding: "<div class='flx flx-cntr-x pad-x pad-y'><button id='btn-sub-man' class='btn group-btn'>Insert Manually</button><button id='btn-add-channel' class='btn group-btn'>Create Channel</button></div>"
	};

	var el = {
		list: $("#subs")
	};

	var getList = () => list;

	var isEditing = () => editing;

	var insert = function (sub, reg) {
		list.push({
			"subreddit": sub,
			"regex": reg
		});
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var _delete = function (sub) {
		var idx = list.findIndex(obj => obj.subreddit === sub);
		list.splice(idx, 1);
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var append = function (subs) {
		if (subs instanceof Array) {
			el.list.append(Mustache.to_html(template.list, subs));
		} else {
			el.list.append($("<a/>")
				.attr({ 'data-name': subs, 'href': '#' })
				.addClass(subredditClasses)
				.text(subs));
		}
	};

	var detach = function (sub) {
		var deletedSub = $(".sub-to-remove[data-name='" + sub + "']");
		deletedSub.addClass("anim-delete");
		setTimeout(function () {
			deletedSub.remove();
		}, 200);

		el.list.find(".sub[data-name=" + sub + "]").remove();
	};

	var setList = function (subs) {
		list = subs;
		Store.setItem("subreeddits", JSON.stringify(list));
		Backup.shouldUpdate();
	};

	var listHasSub = function (newSub) {
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

	var getAllSubsString = function () {
		var allSubs = '',
			frontPage = 'frontpage',
			all = 'all';
		for (var i = 0; i < list.length; i++) {
			var sub = list[i].subreddit.toLowerCase();
			if (sub === frontPage ||
				sub === all) {
				continue;
			}
			allSubs += sub + '+';
		}
		return allSubs.substring(0, allSubs.length - 1);
	};

	var loadSaved = function (subredditsData) { // Only should execute when first loading the app
		var subs = Store.getItem("subreeddits");
		if (subs) {
			subs = JSON.parse(subs);
		}
		list = subs;
		if (!list) { // If it hasn't been loaded to the 'local Store', save defaults subreddits
			setList(subredditsData);
		}
		append(list);
	};

	var loadPosts = function (sub) {
		let results = list.filter(item => item.subreddit.toLowerCase() === sub.toLowerCase());
		if (sub !== CurrentSelection.getName() || editing) {
			var url;
			if (sub.toLowerCase() === 'frontpage') {
				url = URLs.init + "r/" + getAllSubsString() + "/";
			} else {
				url = URLs.init + "r/" + sub + "/";
			}
			if (results.length>0) {
				Posts.load(url, "", results[0].regex);
			} else {
				Posts.load(url, "", "");
			}
			CurrentSelection.setSubreddit(sub);
		}
		UI.setSubTitle(sub);
	};

	var remove = function (sub) {
		_delete(sub);
		detach(sub);
		if (CurrentSelection.getType() === CurrentSelection.Types.SUB &&
			CurrentSelection.getName() === sub) { // If it was the current selection
			CurrentSelection.setSubreddit(defaults[0].subreddit);
		}
	};

	var add = function (newSub, regex) {
		if (listHasSub(newSub)) {
			return;
		}
		insert(newSub, regex);
		append(newSub);
	};
	var update = function (newSub, regex) {
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

	var addFromNewForm = function () {
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
			success: function (data) {
				if (txtReg) {
					var regexData = new RegExp(txtReg, 'i');
					let filteredPosts = data;
					filteredPosts.data.children = data.data.children.filter(post => regexData.test(post.data.title));
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
			error: function () {
				alert('Oh, the subreddit you entered is not valid...');
			}
		});
	};
	var updateFromNewForm = function () {
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
			success: function (data) {
				if (txtReg) {
					var regexData = new RegExp(txtReg, 'i');
					let filteredPosts = data;
					filteredPosts.data.children = data.data.children.filter(post => regexData.test(post.data.title));
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
			error: function () {
				alert('Oh, the subreddit you entered is not valid...');
			}
		});
	};

	var setEditing = function (/* boolean */ newEditing) {
		if (newEditing === editing) {
			return;
		}
		editing = newEditing;
		if (is.wideScreen) {
			UI.switchDisplay(Footer.el.getRefreshButton(), newEditing);
			UI.switchDisplay(SortSwitch.el.getWrap(), newEditing);
		}
	};

	var loadForAdding = function () {
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
					success: function (list) {
						idLast = list.data.after;
						loadedSubs = Mustache.to_html(template.toAddList, list.data);
						main.empty().append(template.topButtonsForAdding).append(loadedSubs).append(template.loadMoreSubsButton);
					},
					error: function () {
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

	var loadForEditing = function () {
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
			setTimeout(function () { // Intentional delay / fix for iOS
				UI.el.mainWrap.html(html);
			}, 10);

			Menu.cleanSelected();
			Posts.setLoading(false);

		}, is.largeScreen ? 1 : 301);

		UI.setSubTitle('Edit Subs');
		setEditing(true);
	};

	var initListeners = function () {

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

		UI.el.body.on('click', "#btn-add-another-sub", function () {
			var container = $("#subs-for-channel");
			container.append("<input type='text' placeholder='Extra subreddit'/>");
			container[0].scrollTop = container.height();
		});

		UI.el.mainWrap.on('click', '#btn-sub-man', () => {
			Modal.show(template.formInsert);
		});
		UI.el.mainWrap.on('click', '.link-wrap', () => {
			$(".main-view").removeClass("show-view");
			$(".detail-view").addClass("show-view");
		});
		UI.el.mainWrap.on('click', '.btn-edit-sub', function() {
			var originalSubreddit = $(this).attr('rid');
			var originalResult = list.filter(item => item.subreddit.toLowerCase() === originalSubreddit.toLowerCase());
			var originalRegex = originalResult[0].regex;
			Modal.show(template.formUpdate);
			setTimeout(function() {
				localStorage.setItem("update_sub", originalSubreddit);
				$('#txt-update-sub').val(originalSubreddit);
				$('#txt-update-reg').val(originalRegex);
			}, 500);
		});

		UI.el.mainWrap.on('click', '#btn-more-subs', (ev) => {
			const target = ev.target;
			$(target).remove();
			var main = UI.el.mainWrap;
			main.append(UI.template.loader);
			$.ajax({
				url: URLs.init + 'reddits/' + URLs.end + '&after=' + idLast,
				dataType: 'jsonp',
				success: function (list) {
					var newSubs = Mustache.to_html(template.toAddList, list.data);
					idLast = list.data.after;
					$('.loader', main).remove();
					main.append(newSubs).append(template.loadMoreSubsButton);
					loadedSubs = loadedSubs + newSubs;
				},
				error: function () {
					$('.loader').addClass('loader-error').text('Error loading more subreddits.');
				}
			});
		});

		UI.el.mainWrap.on('click', '.btn-add-sub', function (ev) {
			ev.preventDefault();
			const parent = $(this).parent(),
				subTitle = $(".js-sub-title", parent);
			subTitle.css("color", "#2b9900"); // 'adding sub' little UI feedback
			const newSub = subTitle.text();
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
