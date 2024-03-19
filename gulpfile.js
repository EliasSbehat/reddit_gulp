var gulp = require("gulp"),
    minifycss = require("gulp-minify-css"),
    jshint = require("gulp-jshint"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    concat = require("gulp-concat-util"),
    prefix = require("gulp-autoprefixer"),
    groupMQ = require("gulp-group-css-media-queries"),
    jade = require("gulp-jade"),
    babel = require("gulp-babel");
var browserSync = require("browser-sync").create();
const sass = require('gulp-sass')(require('sass'));
var paths = {
    styles: "styles/**/*.scss",
    scripts: [
        "scripts/modules/_ui.js",
        "scripts/modules/**/*.js",
        "scripts/init.js"
    ],
    templates: {
        root: "templates/index.jade",
    },
    watch: {
        scripts: ["scripts/**/*.js", "!scripts/modules.js"],
        styles: "styles/**/*.scss",
        templates: "templates/**/*.jade",
    },
    root: "./",
    distribution: "dist/",
};

function styles() {
    return gulp.src(paths.styles)
        .pipe(sass().on('error', sass.logError))
        .pipe(
            prefix({
                cascade: false
            })
        )
        .pipe(groupMQ())
        .pipe(gulp.dest(paths.distribution))
        .pipe(minifycss())
        .pipe(rename(function (path) {
            path.basename += ".min";
        }))
        .pipe(gulp.dest(paths.distribution));
}

function scripts() {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(babel())
        .pipe(concat("app.js"))
        .pipe(gulp.dest(paths.distribution))
        .pipe(uglify())
        .pipe(rename("app.min.js"))
        .pipe(gulp.dest(paths.distribution));
}

function templates() {
    return gulp.src(paths.templates.root)
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest(paths.root));
}

function watch() {
    browserSync.init({ server: "./" });
    gulp.watch(paths.watch.styles, styles).on("change", browserSync.reload);
    gulp.watch(paths.watch.scripts, scripts).on("change", browserSync.reload);
    gulp.watch(paths.watch.templates, templates).on("change", browserSync.reload);
}

const serve = gulp.series(gulp.parallel(styles, scripts, templates), watch);
const build = gulp.series(gulp.parallel(styles, scripts, templates));
// gulp.task('dev', function() {
// 	gulp.watch(paths.watch.styles, ['styles']);
// 	gulp.watch(paths.watch.scripts, ['scripts']);
// 	gulp.watch(paths.watch.templates, ['templates']);
// });
exports.styles = styles;
exports.scripts = scripts;
exports.templates = templates;
exports.serve = serve;
exports.default = build;
