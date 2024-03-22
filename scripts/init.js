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

var initDefaults = [
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
];
var defaults = [];
const initSqlJs = window.initSqlJs;
var DB_NAME = 'reddit_db';
const initDb = () => {
	return new Promise((resolve, reject) => {
		initSqlJs({
			locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.3.0/dist/${file}`
		}).then(SQL => {
			const db = new SQL.Database();
			db.run("CREATE TABLE subreddits(subreddit text, regex text);");
			db.run("CREATE TABLE threads(id text);");
			for (var i = 0; i < initDefaults.length; i++) {
				const result = db.exec("SELECT * FROM subreddits WHERE subreddit='" + initDefaults[i].subreddit + "';");
				if (result.length == 0) {
					db.run("INSERT INTO subreddits VALUES ('" + initDefaults[i].subreddit + "', '" + initDefaults[i].regex + "');");
				}
			}
			db.run("INSERT INTO threads VALUES ('testid');");
			const subreddits = db.exec("SELECT * FROM subreddits;");
			if (subreddits.length > 0) {
				for (var j = 0; j < subreddits[0].values.length; j++) {
					defaults.push({
						"subreddit": subreddits[0].values[j][0],
						"regex": subreddits[0].values[j][1]
					});
				}
			}
			resolve(db);
		}).catch(error => {
			reject(error);
		});
	});
};

initDb().then((db) => {
	saveDB(db);
	console.log("Database initialization successful.");
	Subreddits.loadSaved(defaults);
	console.log(defaults);
	Channels.loadSaved();

	if (location.hash) {
		Comments.navigateFromHash();
	}

	CurrentSelection.execute(
		function () { // If it's a subreddit
			var currentSubName = CurrentSelection.getName();
			Menu.markSelected({ name: currentSubName });
			// Load links
			if (currentSubName.toUpperCase() === 'frontPage'.toUpperCase()) {
				CurrentSelection.setSubreddit('frontPage');
				Posts.load(URLs.init + "r/" + Subreddits.getAllSubsString() + "/");
			} else {
				Posts.load(URLs.init + "r/" + currentSubName + "/");
			}
			UI.setSubTitle(currentSubName);
		}, function () { // If it's a channel
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
}).catch(error => {
	console.error("Error initializing database:", error);
});
function saveDB(db) {
	var binaryArray = db.export(); // Convert the db to binary array
	window.localStorage.setItem("dbBackup", JSON.stringify([...binaryArray]));

	// // Save to IndexedDB
	// var openRequest = indexedDB.open(DB_NAME, 1);
	// openRequest.onsuccess = function (event) {
	// 	var database = event.target.result;
	// 	var transaction = database.transaction([DB_NAME], "readwrite");
	// 	var objectStore = transaction.objectStore(DB_NAME);
	// 	objectStore.clear(); // Clear existing entries
	// 	const key = Date.now();
	// 	objectStore.add(binaryArray, key); // Add the binaryArray to object store
	// };
	// openRequest.onupgradeneeded = function(event) {
	// 	var database = event.target.result;
	// 	database.createObjectStore(DB_NAME); // Create object store if it doesn't exist
	// };
}
// Subreddits.loadSaved();

