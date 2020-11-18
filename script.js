var ko_data = {
    folders: ko.observable([]),
    files: ko.observable([]),
    parent_dir: ko.observable(''),
    container: ko.observable('')
};
var ko_head_data = { container: ko_data.container };

var blobs;
var container;

var icon_extensions = {
    archive: [".7z", ".bz2", ".cab", ".gz", ".tar"],
    audio: [".aac", ".aif", ".aifc", ".aiff", ".ape", ".au", ".flac", ".iff", ".m4a", ".mid", ".mp3", ".mpa", ".ra", ".wav", ".wma", ".f4a", ".f4b", ".oga", ".ogg", ".xm", ".it", ".s3m", ".mod"],
    bin: [".bin", ".hex"],
    bmp: [".bmp"],
    c: [".c"],
    calc: [".xlsx", ".xlsm", ".xltx", ".xltm", ".xlam", ".xlr", ".xls", ".csv"],
    cd: [".iso"],
    cpp: [".cpp"],
    css: [".css", ".sass", ".scss"],
    deb: [".deb"],
    doc: [".doc", ".docx", ".docm", ".dot", ".dotx", ".dotm", ".log", ".msg", ".odt", ".pages", ".rtf", ".tex", ".wpd", ".wps"],
    draw: [".svg", ".svgz"],
    eps: [".ai", ".eps"],
    exe: [".exe"],
    gif: [".gif"],
    h: [".h"],
    html: [".html", ".xhtml", ".shtml", ".htm", ".URL", ".url"],
    ico: [".ico"],
    java: [".jar"],
    jpg: [".jpg", ".jpeg", ".jpe"],
    js: [".js", ".json"],
    markdown: [".md"],
    package: [".pkg", ".dmg"],
    pdf: [".pdf"],
    php: [".php", ".phtml"],
    playlist: [".m3u", ".m3u8", ".pls", ".pls8"],
    png: [".png"],
    ps: [".ps"],
    psd: [".psd"],
    py: [".py"],
    rar: [".rar"],
    rb: [".rb"],
    rpm: [".rpm"],
    rss: [".rss"],
    script: [".bat", ".cmd", ".sh"],
    sql: [".sql"],
    tiff: [".tiff", ".tif"],
    text: [".txt", ".nfo"],
    video: [".asf", ".asx", ".avi", ".flv", ".mkv", ".mov", ".mp4", ".mpg", ".rm", ".srt", ".swf", ".vob", ".wmv", ".m4v", ".f4v", ".f4p", ".ogv"],
    xml: [".xml"],
    zip: [".zip"]
};

function node_val(doc, node_path) {
    var nodes = node_path.split('/');
    var anchor_node = doc;
    for(var x in nodes) {
        anchor_node = anchor_node.getElementsByTagName(nodes[x])[0];
    }
    // return anchor_node.innerHTML;
    return $(anchor_node).text();
}

function get_icon(name, type) {
    var icon = "default";

    if (type.startsWith("text/")) {
        icon = "text";
    } else if (type.startsWith("image/")) {
        icon = "image";
    } else if (type.startsWith("audio/")) {
        icon = "audio";
    } else if (type.startsWith("video/")) {
        icon = "video";
    }

    for(var icon_name in icon_extensions) {
        var extns = icon_extensions[icon_name];
        if (extns.some((ext) => name.endsWith(ext))) {
            icon = icon_name;
            break;
        }
    }

    return `theme/icons/${icon}.png`;
}

function format_size(bytes) {
    var i = -1;
    var byteUnits = ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
    do {
        bytes = bytes / 1024;
        i++;
    } while (bytes > 1024);

    return Math.max(bytes, 0.1).toFixed(1) + byteUnits[i];
};

function format_date(date) {
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}`;
}

function load_files() {
    container = document.location.hash.slice(1).split('/')[1];
    ko_data.container(container);

    $.ajax(`/${container}?restype=container&comp=list`).done(function(data) {
        blobs = Array.from(data.getElementsByTagName("Blob")).map((blob) => Object({
            name: node_val(blob, "Name"),
            url: node_val(blob, "Url"),
            last_modified: (new Date(node_val(blob, "Properties/Last-Modified"))),
            size: parseInt(node_val(blob, "Properties/Content-Length")),
            type: node_val(blob, "Properties/Content-Type")
        }));
        navigate();
    });
}

function navigate() {
    var doc_hash = decodeURIComponent(document.location.hash);
    if (doc_hash.endsWith('/')) {
        doc_hash = doc_hash.slice(0, -1);
    }
    var cwd = doc_hash.split('/').slice(2).join('/');
    ko_data.parent_dir(doc_hash.split('/').slice(0, -1).join('/'));
    var folders = [];
    var folder_map = {};
    var files = [];
    for(var x in blobs) {
        var blob = blobs[x];
        var name = decodeURIComponent(blob.name);
        if (cwd == "" || name.startsWith(cwd + "/")) {
            if (cwd != "") {
                name = name.slice(cwd.length + 1);
            }
            if (name.indexOf('/') < 0) {
                files.push({
                    name: name,
                    icon: get_icon(name, blob.type),
                    link: blob.url,
                    size: format_size(blob.size),
                    last_modified: format_date(blob.last_modified)
                });
            } else {
                name = name.split('/')[0];
                var entry = folder_map[name];
                if (entry == undefined) {
                    entry = folder_map[name] = {
                        name: name,
                        last_modified: blob.last_modified,
                        link: `#/${container}/${cwd}/${name}`.replace('//', '/'),
                        size: blob.size
                    };
                } else {
                    if (blob.last_modified > entry.last_modified) {
                        entry.last_modified = blob.last_modified;
                    }
                    entry.size += blob.size;
                }
            }
        }
    }
    for(var name in folder_map) {
        var entry = folder_map[name];
        entry.last_modified = format_date(entry.last_modified);
        entry.size = format_size(entry.size);
        folders.push(entry);
    }
    ko_data.folders(folders.sort((a, b) => a.name.localeCompare(b.name)));
    ko_data.files(files.sort((a, b) => a.name.localeCompare(b.name)));
}

$(document).ready(function() {
    load_files();

    $(window).on('hashchange', navigate);

    ko.applyBindings(ko_data);
    ko.applyBindings(ko_head_data, document.getElementById("topHead"));
});