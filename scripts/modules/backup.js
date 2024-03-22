/* global
 $,
 $$,
 is,
 UI,
 Modal,
 Store
 */

var Backup = (function () {

	var update = 1;

	const el = {
		buttonExportData: $('#exp-data'),
		buttonImportData: $('#imp-data')
	};

	const template = {
		exportData: `
		<div class='new-form move-data'>
			${UI.template.closeModalButton}
			<div class='move-data-exp'>
				<h3>Export Data</h3>
				<p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p>
				<a class="btn no-ndrln txt-cntr blck w-100 mrgn-y pad-y"
				   id="btn-download-data"
				   download="reedditdata.json">Download Data</a>
			</div>
		</div>`,
		importData: `
		<div class='new-form move-data'>
			${UI.template.closeModalButton}
			<div class='move-data-imp'>
				<h3>Import Data</h3>
				<p>Load the subscriptions from another Reeddit instance.</p>
				<p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p>
				<button class='btn w-100 mrgn-y pad-y'
						    id='btn-trigger-file'>Choose Backup file</button>
				<input id='file-chooser'
							 class="hide"
					     type="file" />
			</div>
		</div>`
	};

	var shouldUpdate = function () {
		update = 1;
	};

	var getBackupData = () => {
		return "{\"channels\": " + Store.getItem("channels") + ", \"subreddits\": " + Store.getItem("subreeddits") + "}";
	};

	var prepareDownloadButton = (data) => {
		let buttonDownload = $$.id('btn-download-data');
		// buttonDownload.href = "data:text/json;charset=utf-8," + encodeURIComponent(data);
	};

	var createBackup = function () {
		if (!update) {
			return;
		}

		Modal.show(template.exportData, function () {
			prepareDownloadButton(getBackupData());
		});
	};

	var loadData = (data) => {
		let refresh = false;

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
		refresh = true;
		// if (data.channels) {
		// 	refresh = true;
		// 	Store.setItem("channels", JSON.stringify(data.channels));
		// }
		if (refresh) {
			window.location.reload();
		}
	};

	let readFile = (file) => {
		let reader = new FileReader();
		reader.onload = function () {
			loadData(reader.result);
		};
		reader.readAsText(file);
	};

	var initListeners = function () {

		// On Menu
		el.buttonExportData.on('click', (ev) => {
			ev.preventDefault();
			createBackup();
		});

		el.buttonImportData.on('click', (ev) => {
			ev.preventDefault();
			Modal.show(template.importData, () => {
				if (is.iOS) {
					UI.switchDisplay($$.id('btn-trigger-file'), true);
					UI.switchDisplay($$.id('file-chooser'), false);
				}
			});
		});

		// Forms
		UI.el.body.on('change', '#file-chooser', function (evt) {
			var config = {
				locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/dist/${filename}`,
			};
			let f = evt.target.files[0];
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
					console.log(contents, discards, archives);
					var defaults = [];
					for (var j = 0; j < contents[0].values.length; j++) {
						defaults.push({
							"subreddit": contents[0].values[j][0],
							"regex": contents[0].values[j][1]
						});
					}
					var discardsData = [];
					for (var k = 0; k < discards[0].values.length; k++) {
						discardsData.push(discards[0].values[k][0]);
					}
					var archivesData = [];
					for (var q = 0; q < archives[0].values.length; q++) {
						archivesData.push(archives[0].values[q][0]);
					}
					loadData({ subreddits: defaults, discards: discardsData, archives: archivesData });
				});
			};
			r.readAsArrayBuffer(f);
			// readFile(file);
		});

		UI.el.body.on('click', '#btn-trigger-file', () => {
			$$.id('file-chooser').click();
		});
		UI.el.body.on('click', '#btn-download-data', () => {
			const initSqlJs = window.initSqlJs;
			var DB_NAME = 'reddit_db';
			const initDb = () => {
				return new Promise((resolve, reject) => {
					initSqlJs({
						locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.3.0/dist/${file}`
					}).then(SQL => {
						var subs = Store.getItem("subreeddits");
						var discards = Store.getItem("discards");
						var archives = Store.getItem("archives");
						var archives_comments = Store.getItem("archives_comments");
						if (subs) {
							subs = JSON.parse(subs);
						}

						const db = new SQL.Database();
						db.run("CREATE TABLE subreddits(subreddit text, regex text);");
						db.run("CREATE TABLE discards(id text);");
						db.run("CREATE TABLE archives(id text);");
						db.run("CREATE TABLE comments(id text, count text);");
						for (var i = 0; i < subs.length; i++) {
							const result = db.exec("SELECT * FROM subreddits WHERE subreddit='" + subs[i].subreddit + "';");
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
								db.run("INSERT INTO comments VALUES ('" + archives_comments[r].id + "', '"+archives_comments[r].comments+"');");
							}
						}
						resolve(db);
					}).catch(error => {
						reject(error);
					});
				});
			};
			initDb().then((db) => {
				var binaryArray = db.export(); // Convert the db to binary array
				window.localStorage.setItem("dbBackup", JSON.stringify([...binaryArray]));
				const arr = JSON.parse(window.localStorage.getItem("dbBackup"));
				var blob = new Blob([new Uint8Array(arr)], { type: "application/octet-stream" });
				var url = URL.createObjectURL(blob);
				var a = document.createElement("a");
				a.href = url;
				a.download = "db.sqlite";
				a.click();
				console.log('Database downloaded successfully');
			}).catch(error => {
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
