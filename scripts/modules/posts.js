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

var Posts = (function () {

	const template = `
		{{#children}}
			<article class='link-wrap flx w-100'>
				<div class='link flx no-ndrln pad-y pad-x js-link' data-id='{{data.id}}'>
					<div class='link-thumb'>
						<div style='background-image: url({{data.thumbnail}})'></div>
					</div>
					<div class='link-info'>
						<a href='{{data.url}}'
						   data-id='{{data.id}}'
						   target='_blank'
						   class='link-title no-ndrln blck js-post-title'>
						{{data.title}}
						</a>
						<div class='link-domain'>{{data.domain}}</div>
						<span class='link-sub'>{{data.subreddit}}</span>
						{{#data.over_18}}
						<span class='link-label txt-bld nsfw'>NSFW</span>
						{{/data.over_18}}
						{{#data.stickied}}
						<span class='link-label txt-bld stickied'>Stickied</span>
						{{/data.stickied}}
						<p class="tagline ">
							submitted 
							<time title="{{data.unix_time}}" class="live-timestamp">
								{{data.time_ago}}
							</time> by 
							<a href="https://old.reddit.com/user/slvrfn" class="author may-blank id-t2_o61cy">
							{{data.author}}
							</a>
							<span class="userattrs"></span>
						</p>
						<p class="tagline ">
							<a href="{{data.url}}" data-event-action="comments" class="bylink comments may-blank" rel="nofollow">{{data.comments}}</a>
							<a href="#">save</a>
						</p>
					</div>
				</div>
				<a href='#comments:{{data.id}}' class='to-comments w-15 flx flx-cntr-y btn-basic'>
					<div class='comments-icon'></div>
				</a>
			</article>
		{{/children}}
		<button id='btn-load-more-posts'
				class='btn blck mrgn-cntr-x'>More</button>
		<div id='main-overflow'></div>`;

	var loading = false,
		list = {},
		loaded = {},
		idLast = '';

	var el = {
		moreButton: function () {
			return $('#btn-load-more-posts');
		}
	};

	var getList = () => list;

	var getLoaded = () => loaded;

	var setLoading = function (newLoading) {
		loading = newLoading;
	};

	var areLoading = () => loading;

	var open = function (url, id) {
		var link = list[id];
		if (link.self || is.wideScreen) {
			Comments.updateHash(id);
		} else {
			triggerClick(url);
		}
	};

	var load = function (baseUrl, paging, regex) {
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
			setTimeout(() => {
				main.prepend(UI.template.loader);
			}, Menu.isShowing() ? 301 : 1);
			paging = ''; // empty string, to avoid pagination
		}
		$.ajax({
			dataType: 'jsonp',
			url: baseUrl + Sorting.get() + URLs.limitEnd + paging,
			success: (result) => {
				if (regex) {
					var regexData = new RegExp(regex, 'i');
					let filteredPosts = result;
					filteredPosts.data.children = result.data.children.filter(post => regexData.test(post.data.title));
					show(filteredPosts, paging);
				} else {
					show(result, paging);
				}
			},
			error: () => {
				loading = false;
				$('.loader').addClass("loader-error").text('Error loading links. Refresh to try again.');
			}
		});
	};

	var loadFromManualInput = function (loadedLinks) {
		show(loadedLinks);
		UI.el.mainWrap[0].scrollTop = 0;
		Subreddits.setEditing(false);
	};

	var render = function (links, paging) { // links: API raw data
		var modifiedLinks = links;
		var childrens = [];
		for (var i=0;i<links.children.length;i++) {
			var linkChild = links.children[i];
			Object.assign(linkChild.data, {
				time_ago: timeAgo(links.children[i].data.created_utc),
				unix_time: unixTime(links.children[i].data.created_utc),
				comments: (links.children[i].data.num_comments==1)?"comment":links.children[i].data.num_comments+" comments"
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
				main
					.empty()
					.removeClass("anim-reveal")
					.addClass(UI.classes.invisible);
			}
		}

		if (linksCount === 0) {
			const message = $('.loader');
			if (message) {
				message
					.text('No Links available.')
					.addClass('loader-error');
				main.append('<div id="#main-overflow"></div>');
			} else {
				main.prepend('<div class="loader loader-error">No Links available.</div><div id="main-overflow"></div>');
			}
		} else {
			// Add new links to the list
			const compiledHTML = Mustache.to_html(template, modifiedLinks);
			// http -> relative in post thumbnails
			// searches and replaces 'url(http' to make sure it's only the thumbnail urls
			const httpsHTML = compiledHTML.replace(/url\(http\:/g, 'url(');
			main.append(httpsHTML);

			// Remove thumbnail space for those links with invalid backgrounds.
			const thumbnails = $('.link-thumb > div');

			// Remove the thumbnail space if post has no thumbnail
			// TODO: parse API json data to make this DOM manipulation not needed
			for (let i = 0; i < thumbnails.length; i++) {
				const thumbnail = $(thumbnails[i]);
				const backgroundImageStyle = thumbnail.attr('style').replace("background-image: ", "");
				
				if (backgroundImageStyle === 'url()' ||
					backgroundImageStyle === 'url(default)' ||
					backgroundImageStyle === 'url(nsfw)' ||
					backgroundImageStyle === 'url(image)' ||
					backgroundImageStyle === 'url(spoiler)' ||
					backgroundImageStyle === 'url(self)') {
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
		}

		if (linksCount < 30) { // Remove 'More links' button if there are less than 30 links
			el.moreButton().remove();
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

	var show = function (result, paging) {
		let posts = result.data;
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

	var setList = function (posts) {
		for (var i = 0; i < posts.children.length; i++) {
			var post = posts.children[i];
			if (list[post.data.id]) { // if already cached
				list[post.data.id].num_comments = post.data.num_comments;
				list[post.data.id].created_utc = post.data.created_utc;
			} else { // if not yet cached
				list[post.data.id] = {
					title: post.data.title,
					encodedTitle: encodeURI(post.data.title),
					selftext: post.data.selftext,
					created_utc: post.data.created_utc,
					domain: post.data.domain,
					subreddit: post.data.subreddit,
					num_comments: post.data.num_comments,
					url: post.data.url,
					self: post.data.is_self,
					link: post.data.permalink,
					author: post.data.author,
					preview: post.data.preview,
					is_gallery: post.data.is_gallery,
					media_metadata: post.data.media_metadata,
					gallery_data: post.data.gallery_data,
					over_18: post.data.over_18,
					stickied: post.data.stickied
				};
			}
		}
	};

	var refreshStream = function () {
		if (Subreddits.isEditing()) {
			return;
		}
		CurrentSelection.execute(function () { // if it's subreddit
			if (CurrentSelection.getName().toLowerCase() === 'frontpage') {
				load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/");
			} else {
				load(URLs.init + "r/" + CurrentSelection.getName() + "/");
			}
		}, function () { // if it's channel
			Channels.loadPosts(Channels.getByName(CurrentSelection.getName()));
		});
	};

	var markSelected = function (id) {
		$(".link.link-selected").removeClass("link-selected");
		$('.link[data-id="' + id + '"]').addClass('link-selected');
	};

	var clearSelected = function () {
		$('.link.link-selected').removeClass('link-selected');
	};

	var triggerClick = function (url) {
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

	var initListeners = function () {

		UI.el.mainWrap.on('click', '.js-link', function (ev) {
			// ev.preventDefault();

			if (!is.wideScreen) {
				return;
			}

			Comments.updateHash(this.dataset.id);
		});

		UI.el.mainWrap.on('click', '.js-post-title', function (ev) {
			ev.preventDefault();

			const id = ev.target.dataset.id,
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
	var timeAgo = function(utcTimestamp) {
		var now = new Date().getTime();
		var timeDifference = now - (utcTimestamp * 1000); //convert unix timestamp to milliseconds
		var differenceInSeconds = Math.floor(timeDifference / 1000);
	  
		if (differenceInSeconds < 60) {
		  return "Just now";
		} else if ((differenceInSeconds / 60) < 60) {
		  return Math.floor(differenceInSeconds / 60) + " minutes ago";
		} else if ((differenceInSeconds / 3600) < 24) {
		  return Math.floor(differenceInSeconds / 3600) + " hours ago";
		} else {
		  return Math.floor(differenceInSeconds / 86400) + " days ago";
		}
	};
	var unixTime = function(unixTime) {
		const date = new Date(unixTime * 1000);

		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		const formattedDate =
			dayNames[date.getUTCDay()] + ' ' +
			monthNames[date.getUTCMonth()] + ' ' +
			String(date.getUTCDate()).padStart(2, '0') + ' ' +
			String(date.getUTCHours()).padStart(2, '0') + ':' +
			String(date.getUTCMinutes()).padStart(2, '0') + ':' +
			String(date.getUTCSeconds()).padStart(2, '0') + ' ' +
			date.getUTCFullYear() + ' UTC';
		return formattedDate;
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
		getLoaded: getLoaded
	};

})();
