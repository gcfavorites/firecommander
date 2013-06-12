Path.Local = function(file) {
	Path.call(this);
	this._file = file;
	this._icon = null;
}

Path.Local.prototype = Object.create(Path.prototype);

/**
 * @throws invalid path string
 */
Path.Local.fromString = function(path) {
	var os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
	if (os == "WINNT") { path = path.replace(/\//g,"\\"); }

	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	file.initWithPath(path);
	return new this(file);
}

/**
 * @throws invalid path string
 */
Path.Local.fromShortcut = function(shortcut) {
	var ds = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
	var path = ds.get(shortcut, Components.interfaces.nsILocalFile);
	return new this(path);
}

Path.Local.prototype.getFile = function() {
	return this._file;
}

Path.Local.prototype.supports = function(feature) {
	switch (feature) {
		case FC.VIEW:
		case FC.EDIT:
			return !this._isDirectory(); 
		break;

		case FC.CREATE:
			return this._isDirectory();
		break;
		
		case FC.CHILDREN:
			return this._isDirectory() && !this.isSymlink();
		break;

		case FC.DELETE:
		case FC.COPY:
		case FC.RENAME:
			return true;
		break;
	}
	return false;
}

Path.Local.prototype.isSymlink = function() {
	try {
		return this._file.isSymlink();
	} catch (e) { return false; }
}

Path.Local.prototype.getImage = function() {
	if (this._icon) { return this._icon; }
	
	if (this._isDirectory()) {
		if (this.isSymlink()) {
			this._icon = "chrome://firecommander/skin/folder-link.png";
		} else {
			this._icon = "chrome://firecommander/skin/folder.png";
		}
	} else {
		if (this.isSymlink()) {
			this._icon = "chrome://firecommander/skin/link.png";
		} else {
			this._icon = FC.getIcon("file://" + this._file.path);
		}
	}
	
	return this._icon;
}

Path.Local.prototype.getPath = function() {
	return this._file.path;
}

Path.Local.prototype.getName = function() {
	return this._file.leafName;
}

Path.Local.prototype.getDescription = function() {
	var d = this._file.path;
	if (this.isSymlink()) { d += " -> " + this._file.target; }
	return d;
}

Path.Local.prototype.getSize = function() {
	if (this._isDirectory()) { return null; }
	try {
		return (this.isSymlink() ? this._file.fileSizeOfLink : this._file.fileSize);
	} catch (e) { return null; }
}

Path.Local.prototype.getTS = function() {
	try {
		return (this.isSymlink() ? this._file.lastModifiedTimeOfLink : this._file.lastModifiedTime);
	} catch (e) { return null; }
}

Path.Local.prototype.getPermissions = function() {
	try { /* macosx does not implement permissionsOfLink */
		return (this.isSymlink() ? this._file.permissionsOfLink : this._file.permissions);
	} catch (e) { return null; }
}

Path.Local.prototype.getSort = function() {
	if (this._isDirectory()) {
		return 1;
	} else {
		return 2;
	}
}

Path.Local.prototype.getItems = function() {
	var result = [];	
	var entries = this._file.directoryEntries;
	
	while (entries.hasMoreElements()) {
		var item = entries.getNext().QueryInterface(Ci.nsILocalFile);
		if (!item.exists()) { continue; } /* some tricky items, such as pagefile */
		result.push(new Path.Local(item));
	}

	return result;
}

Path.Local.prototype.activate = function(panel, fc) {
	if (this._isDirectory()) {
		var target = this;
		if (this.isSymlink()) {
			target = Path.Local.fromString(this._file.target);
		}
		panel.setPath(target);
	} else {
		if (fc.handleExtension(this)) { return; }
		this._file.launch();
	}
}

Path.Local.prototype.getParent = function() {
	if (this._file.parent) {
		return new Path.Local(this._file.parent);
	} else {
		return null;
	}
}

Path.Local.prototype.exists = function() {
	return this._file.exists();
}

Path.Local.prototype.equals = function(path) {
	if (!(path instanceof Path.Local)) { return (path.getPath() == this.getPath()); }
	return this._file.equals(path._file);
}

Path.Local.prototype.delete = function() {
	this._file.remove(false);
}

Path.Local.prototype.create = function(directory) {
	var type = (directory ? Ci.nsIFile.DIRECTORY_TYPE : Ci.nsIFile.FILE_TYPE);
	var perms = (directory ? 0775 : 0664);
	this._file.create(type, perms /* FIXME */);
}

Path.Local.prototype.append = function(name) {
	var f = this._file.clone();
	f.append(name);
	return new Path.Local(f);
}

Path.Local.prototype.rename = function(name) {
	this._file.moveTo(null, name);
}

Path.Local.prototype.inputStream = function() {
	var is = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
	is.init(this._file, -1, -1, 0);
	return is;
}

Path.Local.prototype.outputStream = function() {
	var os = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
	/* fixme mode */
	os.init(this._file, -1, -1, 0);
	return os;
}

Path.Local.prototype._isDirectory = function() {
	try {
		return this._file.isDirectory();
	} catch (e) { return false; }
}
