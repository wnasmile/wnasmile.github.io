COMMANDS
!fetch:devBuild (get devBuild exec url 'devBuildUrl')

!fetch:refresh (refresh/fetch sheets again) - normal 'sheetUrl'

!fetch:failTest (force fail of fetch/get the fail state while hiding the pages)

!fetch:R (remove 'devBuildUrl' or remove failTest, and set back to original 'sheetUrl')

!themifyMe1 (manual command to force theme "1")

!themifyMe2 (manual command to force theme "2")

!themifyMe3 (manual command to force theme "3")

!themifyMe4 (manual command to force theme "4")

!themifyMe5 (manual command to force theme "5")

!themifyMe6 (manual command to force theme "6")

!themifyMe7 (manual command to force theme "7")

!themifyMe8 (manual command to force theme "8")

!themifyMe9 (manual command to force theme "9")

!themifyMe0 (manual command to force theme "0")

!themifyMeR (reset/root)

#install:widget/buddy! (fake install since it already comes with the index.html)

#install:widget/soundscapev1 (fake install since it already comes with the index.html)

// what these widget commands do is allow permission to use the widgets without cluttering the screen, along with users can manually set their widgets that they want while keeping any updates private until new releases.

// now this is the fun part!

!appy.widget-apply:buddy!

!appy.widget-apply:soundscapev1 (these now apply the widgets on init, so its saved locally and it is always applied when openned!)

 

// also this:

 

!appy.widget-rem:buddy!

!appy.widget-rem:soundscapev1 (this removes the widget while keeping them installed for later use.)

 

// even better here:

 

!appy.instalr-UNINST;buddy!

!appy.instalr-UNINST;soundscapev1

 

// this uninstalls the widgets entirely from the user (obv there was no installation to begin with but this is just redundant and funnylol)