# Extending Fire Commander #

Fire Commander is extended by providing _handler_ for different tasks.

## Protocol handlers ##

These are used to handle various non-standard and virtual paths, e.g. _drives://_, _fav://_, _zip://_ etc. Protocol handler registers itself via `FC.addProtocolHandler("protoName", factoryMethod)`.

## Viewer handlers ##

Viewing a file (via F3) launches one of these. Viewer handler registers itself via `FC.addViewerHandler("extension", handlerClass)`.

## Extension handlers ##

Extension handler is executed when user activates a file (enter, doubleclick). Extension handler registers itself via `FC.addExtensionHandler("extension", factoryMethod)`.