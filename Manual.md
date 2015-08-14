# Fire Commander Manual #

Fire Commander is a tool aimed at power users, who prefer traditional two-panel layout, no toolbars and keyboard control.



## Installation & Running ##

There are various different ways in which Fire Commander can be run.

### As a Firefox extension - from XPI ###

Just pick an XPI from the [Downloads](http://code.google.com/p/firecommander/downloads/list) page. This might not be the latest version, though.

After installation (and Firefox restart), Fire Commander will be available in the menu, or via the Alt+C keyboard shortcut.

### As a Firefox extension - from Mercurial ###

Latest Fire Commander is available via `hg clone`. After you retrieve the code, either
  1. copy the directory `firecommander@ondras.zarovi.cz` to your Firefox `profile/extensions` directory, or
  1. use the `makexpi.sh` script to create a .xpi file and install it in traditional way.

Launching is the same as in the previous method.

### As a XULRunner application ###

You don't need Firefox using this approach.

  1. Download and install [XULRunner](https://developer.mozilla.org/en/XULRunner)
  1. [Download](http://code.google.com/p/firecommander/downloads/list) a **xr** version of Fire Commander (any version ending with **-xr.zip**)
  1. Unpack the Fire Commander archive
  1. Launch `xulrunner path/to/firecommander/application.ini`

### As a XULRunner application, launched from Firefox ###

Hybrid usage: needs Firefox, but uses its own XULRunner. Therefore, Firefox does not need to run.

  1. Download a **xr** version of Fire Commander (step #2 above)
  1. Unpack it (step #3 above)
  1. Launch `firefox -app /path/to/firecommander/application.ini`

## Usage ##

  * See KeyboardShortcuts for help.
  * Internal image viewer works for JPG, PNG, GIF, BMP and ICO formats.
  * Internal audio viewer works for WAV and OGG formats.
  * Internal video viewer works for OGV format.
  * The ZIP viewer supports ZIP, JAR and XPI formats.

## Comments, feature requests ##

ondrej.zara@gmail.com