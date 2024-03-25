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

var LinkSummary = (function() {

	const template = `
		<section id='link-summary'>
			${UI.template.closeThreadButton}
			<a href='{{url}}' style='max-width:97%;'
			   target='_blank'
			   class='no-ndrln'>
				<span id='summary-title'
					  class='pad-x txt-bld blck'>{{title}}</span>
				<span id='summary-domain'
					  class='pad-x txt-bld'>{{domain}}</span>
				{{#over_18}}
				<span class='link-label txt-bld summary-label nsfw'>NSFW</span>
				{{/over_18}}
				{{#stickied}}
				<span class='link-label txt-bld summary-label stickied'>Stickied</span>
				{{/stickied}}
			</a>
			<div id='summary-footer'>
				<span id='summary-author'
					  class='pad-x txt-bld'>by {{author}}</span>
			</div>
			<div id='summary-preview'>
			</div>
			<div id='summary-btn'>
				<a class='btn mrgn-x no-ndrln save-tw'
					  id='share-tw'
					  rid='{{name}}'
					  href='#'>Save</a>
				<a class='btn mrgn-x no-ndrln'
				   id='share-tw'
				   target='_blank'
				   href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a>
				<a class='btn mrgn-x no-ndrln discard-tw'
				   id='discard-tw'
				   rid='{{name}}'
				   href='#'>Discard</a>
			</div>
			<div class='ls-extra flx flx-spc-btwn-x txt-bld'>
				<span class='w-33'
					  id='summary-sub'>{{subreddit}}</span>
				<span class='w-33 txt-cntr'
					  id='summary-time'></span>
				<a class='w-33 no-ndrln txt-r clr-current'
				   id='summary-comment-num'
				   title='See comments on reddit.com'
				   href='http://reddit.com{{link}}'
				   target='_blank'>{{num_comments}} comments</a>
			</div>
		</section>`;

	var setPostSummary = function(data, postID) {
		if (!data.link) {
			data.link = data.permalink;
		}
		// Main content
		var summaryHTML = Mustache.to_html(template, data);
		// Check for type of post
		if (data.selftext) { // If it's a self-post
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
			let re = new RegExp(searchString, 'g');
			let newString = selfText.replace(re, replacementString);
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
			if (linkURL) { // if it's a YouTube video
				var youTubeID = getYouTubeVideoIDfromURL(linkURL);

				if (youTubeID) {
					summaryHTML +=
						`<a class="video-preview-btn preview-container blck" 
								href="#" data-id="${youTubeID}">
						 <img class="video-preview" 
						      src="//img.youtube.com/vi/${youTubeID}/hqdefault.jpg"/>
						 </a>
						 <div class="video-preview-box"></div>`;
				} else if (domain == 'v.redd.it') {
					summaryHTML +=
						`<div style="text-align:center;">
							<video id='my-video' class='video-js' data-setup='{}' style="width=100%" controls>
								<source src='${Posts.getList()[postID].secure_media.reddit_video.dash_url}' type='video/mp4'>
								<source src='${Posts.getList()[postID].secure_media.reddit_video.fallback_url}' type='audio/mp4'>
								<p class='vjs-no-js'>
									To view this video please enable JavaScript, and consider upgrading to a web browser that
									<a href='https://videojs.com/html5-video-support/' target='_blank'>supports HTML5 video</a>
								</p>
							</video>
						</div>`;
				} else if (isGallery) {
					summaryHTML += '<div class="wrapper_gallery">';
					for (var i=0;i<gallery_data.items.length;i++) {
						summaryHTML += `
						<div class="card_gallery">
							<a href="#preview" target="_blank" class="preview-container blck js-gallery-preview" data-img="${media_metadata[gallery_data.items[i].media_id].s.u}">
							<img src="${media_metadata[gallery_data.items[i].media_id].p[0].u}" class="cover_gallery image-preview" alt="">
							</a>
						</div>`;
					}
					summaryHTML += '</div>';
				} else if (imageLink) { // If it's an image link
					summaryHTML +=
						// '<a href="'+imageLink+'" target="_blank" class="preview-container blck js-img">' +
						// '<img class="image-previews" src="' + imageLink + '" />' +
						// '</a>';
						'<a href="#preview" class="preview-container blck js-img-preview" data-img="' + imageLink + '">' +
						'<img class="image-preview" src="' + imageLink + '" height=500 />' +
						'</a>';
				} else { // if it's a Gfycat or RedGifs link
					var gfycatID = getGfycatIDfromURL(linkURL);
					var redGifsID = getRedGifsIDfromURL(linkURL);
					if (gfycatID) {
						summaryHTML +=
							"<div style='position:relative; padding-bottom:56.69%'>" +
							"<iframe src='https://gfycat.com/ifr/" + gfycatID + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>" +
							"</div>";
					} else if (redGifsID) {
						summaryHTML +=
							"<div style='position:relative; padding-bottom:56.69%'>" +
							"<iframe src='https://redgifs.com/ifr/" + redGifsID + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>" +
							"</div>";
					}
				}
			}
		// }
		summaryHTML += "<section id='comments-container'></section>";
		UI.el.detailWrap.append(summaryHTML);
		updatePostTime(data.created_utc);
		Posts.getList()[postID].summary = summaryHTML;
		Footer.el.postTitle.text(data.title);
	};

	var updatePostSummary = function(data, postID) {
		$("#summary-comment-num").text(data.num_comments + (data.num_comments === 1 ? ' comment' : ' comments'));
		// Time ago
		updatePostTime(data.created_utc);
		Posts.getList()[postID].num_comments = data.num_comments;
		Posts.getList()[postID].created_utc = data.created_utc;
	};

	var updatePostTime = function(time) {
		$("#summary-time").text(timeSince(new Date().getTime(), time));
	};

	var checkImageLink = function(url) {
		var matching = url.match(/\.(svg|jpe?g|png|gifv?)(?:[?#].*)?$|(?:imgur\.com|livememe\.com|reddituploads\.com)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);
		if (!matching) {
			return '';
		}
		if (matching[1]) { // normal image link
			if (url.indexOf('.gifv') > 0) {
				url = url.replace('.gifv', '.gif');
			}
			if (url.indexOf('imgur.com') >= 0) {
				url = url.replace(/^htt(p|ps):/, '');
			}
			return url;
		} else if (matching[2]) {
			if (matching[0].slice(0, 5) === "imgur") { // imgur
				return `//imgur.com/${matching[2]}.jpg`;
			} else if (matching[0].indexOf("livememe.") >= 0) { // livememe
				return `http://i.lvme.me/${matching[2]}.jpg`;
			} else if (matching[0].indexOf("reddituploads.") >= 0) { // reddit media
        return matching.input;
      } else {
				return null;
			}
		} else {
			return null;
		}
	};

	var getYouTubeVideoIDfromURL = function(url) {
		var matching = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
		if (!matching) {
			return '';
		}
		else {
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

	const initListeners = () => {
		UI.el.detailWrap.on('click', '.js-img-preview', function(ev) {
			ev.preventDefault();
			Modal.showImageViewer(this.dataset.img);
		});
		UI.el.detailWrap.on('click', '.js-gallery-preview', function(ev) {
			ev.preventDefault();
			var gallerys = $(this).parent().parent().children();
			var img_urls = [];
			for (var y=0;y<gallerys.length;y++) {
				var gallery = gallerys[y];
				img_urls.push($(gallery).find('a').attr('data-img'));
			}
			console.log(img_urls);
			Modal.showGalleryViewer(img_urls);
		});
		UI.el.detailWrap.on('click', '.discard-tw', function(ev) {
			ev.preventDefault();
			var id = $(this).attr('rid');
			console.log(id);
			$("#"+id).css('display', 'none');
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
		UI.el.detailWrap.on('click', '.save-tw', function(ev) {
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
		UI.el.detailWrap.on('click', '.video-preview-btn', function(ev) {
			ev.preventDefault();
			$(this).css('display', 'none');
			$(this).parent().find(".video-preview-box").html(
				`<iframe 
					width="560" 
					height="315" 
					src="https://www.youtube.com/embed/${$(this).attr('data-id')}?controls=1&autoplay=0" 
					title="YouTube video player" 
					frameborder="0" 
					style="display: block;margin: 0px auto;"
					allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
					allowfullscreen>
				</iframe>`
			);
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
