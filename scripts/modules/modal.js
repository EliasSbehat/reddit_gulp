/* global
 Menu,
 Anim,
 is,
 UI
 */

var Modal = (function () {

	let showing = false;

	const setShowing = (shown) => {
		showing = shown;
	};

	const isShowing = () => showing;

	var show = function (template, callback, config) {
		var delay = 1;
		if (!is.largeScreen && Menu.isShowing()) {
			Menu.move(UI.Move.LEFT);
			delay = 301;
		}
		setTimeout(function () {
			if (isShowing()) {
				return;
			}
			var modal = $('<div/>').attr({ id: 'modal', tabindex: '0', class: 'modal' }),
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

	var remove = function () {
		var modal = $('#modal');
		modal.css('opacity', '');
		setShowing(false);
		setTimeout(function () {
			modal.remove();
			switchKeyListener(false);
		}, 301);
	};

	var showImageViewer = function (imageURL) {
		var imageViewer = '<img class="image-viewer centered-transform" src="' + imageURL + '">',
			config = {
				modalClass: 'modal--closable',
				noBounce: true
			};
		Modal.show(imageViewer, false, config);
	};
	var showGalleryViewer = function (imageURL) {
		console.log(imageURL);
		var imageViewer = `<div style="align-items: center;
				display: flex;
				justify-content: center;
				margin: 0;"><div class="carousel">
				<div class="buttons-container">
				<button id="left" class="gallery_btn">Prev</button>
				<button id="right" class="gallery_btn">Next</button>
				</div>
			<div class="image-container" id="imgs" style="">`;
		for (var i = 0; i < imageURL.length; i++) {
			imageViewer += `<img
				src="${imageURL[i]}"
				alt="second-image"
				style="object-fit: cover; width:300px;"
			/>`;
		}
		imageViewer += `</div>
			</div></div>`;
		var config = {
			modalClass: 'modal--closable',
			noBounce: true
		};
		Modal.show(imageViewer, false, config);
	};

	const handleKeyPress = (ev) => {
		if (ev.which === 27) {
			remove();
		}
	};

	const switchKeyListener = (flag) => {
		if (flag) {
			UI.el.body.on('keydown', handleKeyPress);
		} else {
			UI.el.body.off('keydown', handleKeyPress);
		}
	};
	var idx = 0;

	const IMG_CONTAINER_WIDTH = 300;
	const handleButtonClick = () => {
		idx += -1;
		changeImage();
	};
	const handleRightButtonClick = () => {
		idx += 1;
		changeImage();
	};
	var initListeners = function () {
		UI.el.body.on('click', '.modal--closable', function(ev){
			console.log(ev.target.className);
			if (ev.target.className!='gallery_btn') {
				Modal.remove();
			}
		});
		UI.el.body.on('click', '#left', handleButtonClick);
		UI.el.body.on('click', '#right', handleRightButtonClick);
	};
	function changeImage() {
		const imgs = $('#imgs');
		const img = $("#imgs").find('img');
		console.log(idx, 'check', img);
		if (idx > img.length - 1) idx = 0;
		else if (idx < 0) idx = img.length - 1;

		imgs.css('transform', `translateX(${-idx * IMG_CONTAINER_WIDTH}px)`);
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
