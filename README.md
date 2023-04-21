# Battle Bugs

## Notes:
Battle Bugs! Instead of ships, bugs. Could be unique and fun with cool animations.

### Priorities:
* Playable/rendered in browser
* Use jQuery
* Follows organization structure as outlined below
* Different CPU difficulties 
* Different game modes
* Cool method to place bugs
* Playable only with keyboard
* Making game pretty 
* Animations & Sounds 

## Organization:

### Home Screen
* Different game modes (2? 3? 5?): select on home screen -- buttons or radio buttons  
    * Probably none that will alter the layout  
* Different difficulties (3?): select on home screen -- maybe up and down arrows with a slot machine type number   changing in the middle  
* Play button  

### Arrange Bugs
* One large grid -- grid display
* Bugs to the right -- grid display, keep it consistent
* User places bugs on their grid -- click starting and ending cell --> drag bug OR green skeleton of bug starts on the board and user can move it with the arrow keys
* Begin game button

### Play Game
* User board on the left, cpu board on the right
* If user turn
    * The opponents board is enlarged and centered (or more centered)
    * User clicks the cell they want to fire on and then presses enter to fire (press enter to fire instructions)
    * Animation runs, turns switch
* If computer turn 
    * User board is enlarged and centered (or more centered)
    * Delay for a lil bit
    * Computer fires a shot, animation runs, turns switch
* If showing the score, or keeping track of shots or something is relevant for a different game mode, those will be shown, but for now I can't think of a reason showing anything besides
* After a miss, "hidden" cell is replaced with... idk... dirt maybe? 
* After a hit, "hidden" cell is replaced with... no ideas for hit animation for bugs quite yet
* Once a whole bug is killed, it is shown (maybe a burnt bug or something? idk cause bugs don't have skeletons) 
* Appropriate messages are displayed

### Game Over
* Victory message displayed
* All user controls disabled besides:
    * Play again button
        * Change difficults option
    * Change game mode button
        * Just reloads page to home screen

