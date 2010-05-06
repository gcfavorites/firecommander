const ASC = 1;
const DESC = -1;

const NAME = 0;
const SIZE = 1;
const TS = 2;
const ATTR = 3;

var Panel = function(fc, container, tab) {
	this.wrappedJSObject = this;
	this._path = null;
	this._fc = fc;
	this._ec = [];
	this._data = [];
	this._columns = [NAME, SIZE, TS, ATTR];
	this._sortData = {
		column: null,
		order: ASC
	}

	this._dom = {
		treebox: null,
		tree: Panel.tree.cloneNode(true),
		path: document.createElement("textbox"),
		tab: tab
	}
	
	this._dom.path.setAttribute("tabindex", "-1"); /* textbox must not be focused after tabswitch */
	container.appendChild(this._dom.path);
	container.appendChild(this._dom.tree);

	/* clicking this tab when active does not focus the tree - do it manually */
	this._ec.push(Events.add(this._dom.tab, "focus", this.focus.bind(this)));
	/* notify owner when our tree is focused */
	this._ec.push(Events.add(this._dom.tree, "focus", this._focus.bind(this)));
	/* tree dblclick */
	this._ec.push(Events.add(this._dom.tree, "dblclick", this._dblclick.bind(this)));
	/* tree keypress */
	this._ec.push(Events.add(this._dom.tree, "keypress", this._keypress.bind(this)));
	/* tree keydown */
	this._ec.push(Events.add(this._dom.tree, "keydown", this._keydown.bind(this)));
	/* path textbox change */
	this._ec.push(Events.add(this._dom.path, "change", this._change.bind(this)));
	
	this._dom.tree.view = this;
	this.changeSort(NAME, ASC);
};
Panel.tree = null;

/* nsITreeView methods */

Panel.prototype.rowCount = 0;

Panel.prototype.setTree = function(treebox) { 
	this._dom.treebox = treebox; 
}

Panel.prototype.getCellText = function(row, column) {
	var item = this._data[row];
	
	switch (this._columns[column.index]) {
		case NAME:
			return item.getName();
		break;
		case SIZE:
			var s = item.getSize();
			if (s === null) {
				return "";
			} else {
				return s.toString().replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, "$1 ");
			}
		break;
		case TS:
			var ts = item.getTS();
			if (ts === null) { return ""; }
			var date = new Date(ts);

			var d = date.getDate();
			var mo = date.getMonth()+1;
			var y = date.getFullYear();

			var h = date.getHours();
			var m = date.getMinutes();
			var s = date.getSeconds();
			if (h < 10) { h = "0"+h; }
			if (m < 10) { m = "0"+m; }
			if (s < 10) { s = "0"+s; }

			return d+"."+mo+"."+y+" "+h+":"+m+":"+s;
		break;
		case ATTR:
			var perms = item.getPermissions();
			if (perms === null) { return ""; }
			var mask = "rwxrwxrwx";
			return mask.replace(/./g, function(ch, index) {
				var perm = 1 << (mask.length-index-1);
				return (perms & perm ? ch : "–");
			});
		break;
	}
}
     
Panel.prototype.getImageSrc = function(row, column) { 
	if (this._columns[column.index] != NAME) { return ""; }
	return this._data[row].getImage();
}
     
Panel.prototype.cycleHeader = function(column) {
	var col = this._columns[column.index];
	var dir = column.element.getAttribute("sortDirection");
	var order = (dir == "ascending" ? DESC : ASC);
	this.changeSort(col, order);
}     
     
Panel.prototype.isEditable = function(row, column) {
	return this._columns[column.index] == NAME;
}     

Panel.prototype.setCellText = function(row, column, text) {
	/* FIXME */
}

Panel.prototype.isSorted = function() { return true; }
Panel.prototype.isSelectable = function(row, column) { return true; }     
Panel.prototype.isContainer = function() { return false; }
Panel.prototype.isSeparator = function(row) { return false; }  
Panel.prototype.getLevel = function(row) { return 0; }  
Panel.prototype.getRowProperties = function(row, props) {}
Panel.prototype.getCellProperties = function(row, col, props) {}
Panel.prototype.getColumnProperties = function(colid, col, props) {}  

/* custom methods */

Panel.prototype.changeSort = function(column, order) {
	this._sortData.column = column;
	this._sortData.order = order;
	
	var cols = this._dom.tree.getElementsByTagName("treecol");
	for (var i=0;i<cols.length;i++) {
		var col = cols[i];
		if (this._columns[i] == column) {
			col.setAttribute("sortDirection", order == ASC ? "ascending" : "descending");
		} else {
			col.setAttribute("sortDirection", "natural");
		}
	}

	this._sort();
	this._update();
}

Panel.prototype.focus = function() {
	this._dom.tree.focus();
}

Panel.prototype.focusPath = function() {
	this._dom.path.focus();
}

Panel.prototype.getItem = function() {
	var index = this._dom.tree.currentIndex;
	if (index == -1) { return null; }
	return this._data[index];
}

Panel.prototype._sort = function() {
	var coef = this._sortData.order;
	var col = this._sortData.column;
	
	this._data.sort(function(a, b) {
		var as = a.getSort();
		var bs = b.getSort();
		if (as != bs) { return as - bs; } /* compare only dir<->dir or file<->file */
		
		switch (col) {
			case NAME:
				var an = a.getName();
				var bn = b.getName();
				
/*				
				var re = /[a-z0-9]/i;
				if (an && bn) {
					if (an[0].match(re) || bn[0].match(re))
				}
*/				
				return coef * an.localeCompare(bn);
			break;
			
			case SIZE:
				var as = a.getSize();
				var bs = b.getSize();
				if (as == bs) { return coef * a.getName().localeCompare(b.getName()); }
				return coef * (as - bs);
			break;
			
			case TS:
				return coef * (a.getTS() - b.getTS());
			break;
			
			case ATTR:
				return coef * (a.getPermissions() - b.getPermissions());
			break;
		}

	});
}

Panel.prototype._update = function() {
	this._dom.treebox.rowCountChanged(0, -this.rowCount);
	this.rowCount = this._data.length;
	this._dom.treebox.rowCountChanged(0, this.rowCount);
}

/**
 * Tree focus - notify parent
 */
Panel.prototype._focus = function(e) {
	this._dom.treebox.ensureRowIsVisible(this._dom.tree.currentIndex );

	var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
	observerService.notifyObservers(this, "panel-focus", this._id);
}

/**
 * Tree doubleclick
 */
Panel.prototype._dblclick = function(e) {
	var row = this._dom.treebox.getRowAt(e.clientX, e.clientY);
	if (row == -1) { return; }
	this._data[row].activate(this);
}

/**
 * Tree keypress
 */
Panel.prototype._keypress = function(e) {
	if (e.keyCode == 13) { /* enter */
		var item = this.getItem();
		if (item) { item.activate(this); }
		return;
	}
	
	var ch = String.fromCharCode(e.charCode).toUpperCase(); /* shift + drive */
	if (ch.match(/[A-Z]/) && e.shiftKey && !e.ctrlKey) {
		try {
			var path = Path.Local.fromString(ch+":");
			if (path.exists()) { this.setPath(path); }
		} catch (e) {}
		return;
	}

}

Panel.prototype._keydown = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	if (ch.match(/[0-9]/) && e.ctrlKey) { /* get/set favorite */
		var prefName = "fav." + ch;
		if (e.shiftKey) { /* set favorite */
			var path = this._path.getPath();
			var text = this._fc.getText("fav.text", path, ch);
			var title = this._fc.getText("fav.title");
			var result = this._fc.showConfirm(text, title)
			if (result) { this._fc.setPreference(prefName, path); }
		} else { /* load favorite */
			var path = this._fc.getPreference(prefName);
			if (path) { this.setPath(path); }
		}
		return;
	}
}

/**
 * Textbox onchange
 */
Panel.prototype._change = function(e) {
	var value = this._dom.path.value;
	if (!value) { return; }

	this.setPath(value);
	this.focus();
}

Panel.prototype.startEditing = function() {
	this._dom.tree.startEditing(this._dom.tree.currentIndex, this._dom.tree.columns[0]);
}

Panel.prototype.refresh = function(selectedPath) {
	var oldIndex = this._dom.tree.currentIndex; /* store original index */
	this._data = this._path.getItems();
	
	var parent = this._path.getParent();
	if (parent) { this._data.push(new Path.Up(parent)); }
	
	this._sort();
	this._update();
	
	var newIndex = Math.min(oldIndex, this._data.length-1); /* try to maintain old index */
	if (selectedPath) { /* try to pre-select a path */
		var ok = false;
		for (var i=0;i<this._data.length;i++) {
			var item = this._data[i];
			if (item.equals(selectedPath)) {
				newIndex = i;
				ok = true;
				break;
			}
		}
		if (!ok) { newIndex = 0; } /* we cannot set original path -> reset index */
	}
	this._dom.tree.currentIndex = newIndex;
	this._dom.treebox.ensureRowIsVisible(newIndex);
}

/**
 * @param {string || Path} path
 */
Panel.prototype.setPath = function(path) {
	var focusPath = this._path;
	
	if (path instanceof Path) { /* path object */
	} else { /* string */
		path = this._fc.getHandler(path);
		if (!path) { return; }
		if (!path.exists()) { 
			this._fc.showAlert(this._fc.getText("error.nopath", value));
			return;
		}
		if (path.getItems() === null) { /* file */
			focusPath = path;
			path = path.getParent(); 
		} 
	}
	
	this._path = path;
	this._dom.tab.label = path.getName() || path.getPath();
	this._dom.path.value = path.getPath();
	
	this.refresh(focusPath);
}

Panel.prototype.getPath = function() {
	return this._path;
}

Panel.prototype.destroy = function() {
	this._ec.forEach(Events.remove, Events);
}
