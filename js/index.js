function main()
{
    size(800, 480);

    console.log("Click here to debug ->");

    // Reminder: take average of push point vectors

    var keys = [];
    keyPressed = function()
    {
        keys[keyCode] = true;
        keys[key.toString()] = true;
    };  
    keyReleased = function()
    {
        keys[keyCode] = false;
        keys[key.toString()] = false;
    };

    var Rect = function(x, y, width, height)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
    };

    var Player = function(x, y, width, height)
    {
        Rect.call(this, x, y, width, height);   

        this.xSpeed = 3;
        this.ySpeed = 3;
    };
    Player.prototype.draw = function() 
    {
        image(this.img, this.previousX, this.previousY, this.width, this.height);

        fill(200, 0, 0);
        ellipse(this.previousX + this.halfWidth, this.previousY + this.halfHeight, 6, 6);

        image(this.img, this.x, this.y, this.width, this.height);

        noFill();
        stroke(0, 0, 0);
        rect(this.x, this.y, this.width, this.height);
        noStroke();
    };
    Player.prototype.update = function()
    {
        if(keys[LEFT] || keys.a)
        {
            this.x -= this.xSpeed;
        }
        if(keys[RIGHT] || keys.d)
        {
            this.x += this.xSpeed;
        }
        if(keys[UP] || keys.w)
        {
            this.y -= this.ySpeed;
        }
        if(keys[DOWN] || keys.s)
        {
            this.y += this.ySpeed;
        }
    };

    var Ground = function(x, y, width, height)
    {
        Rect.call(this, x, y, width, height);   
    };
    Ground.prototype.draw = function()
    {
        image(this.img, this.x, this.y, this.width, this.height);

        noFill();
        stroke(0, 0, 0);
        rect(this.x, this.y, this.width, this.height);
        noStroke();
    };

    var Camera = function(x, y, width, height)
    {
        Rect.call(this, x, y, width, height);

        this.focusX = this.halfWidth;
        this.focusY = this.halfHeight;
        
        this.follow = function(object)
        {
            translate(this.x + this.halfWidth - (this.focusX = object.x + object.halfWidth), 
                      this.y + this.halfHeight - (this.focusY = object.y + object.halfHeight));
        };
    };

    var PixelObserver = function()
    {
        this.colliding = function(object, hitObject)
        {
            // I will change this to a boundingBox check later!
            var boxTest = (object.x + object.width >= hitObject.x && 
                           object.x <= hitObject.x + hitObject.width) && 
                          (object.y + object.height >= hitObject.y && 
                           object.y <= hitObject.y + hitObject.height);

            if(!boxTest)
            {
                return false;
            }

            var imageDataA = object.img.imageData;
            var imageDataB = hitObject.img.imageData;

            var x1 = max(hitObject.x, object.x);
            var y1 = max(hitObject.y, object.y);
            var x2 = min(hitObject.x + hitObject.width, object.x + object.width);
            var y2 = min(hitObject.y + hitObject.height, object.y + object.height);

            var sx = Math.round(x1 - object.x);
            var sy = Math.round(y1 - object.y);

            var sx2 = Math.round(x1 - hitObject.x);
            var sy2 = Math.round(y1 - hitObject.y);

            var w = x2 - x1;
            var h = y2 - y1;

            var x, y, i;

            for(x = 0; x < w; x++)
            {
                for(y = 0; y < h; y++)
                {
                    if(imageDataA.data[3 + ((x + sx) + imageDataA.width * (y + sy)) * 4] !== 0 &&
                       imageDataB.data[3 + ((x + sx2) + imageDataB.width * (y + sy2)) * 4] !== 0)
                    {
                        return true;
                    } 
                }
            }

            return false;
        };

        this.solveCollison = function(object, hitObject)
        {
            var raycastAngle = atan2((object.y + object.halfHeight) - (object.previousY + object.halfHeight), 
                                     (object.x + object.halfWidth) - (object.previousX + object.halfWidth));

            fill(200, 0, 0);

            var imgData = hitObject.img.imageData;

            var hitLeft = hitObject.x,
                hitRight = hitObject.x + hitObject.img.width;

            var hitTop = hitObject.y,
                hitBottom = hitObject.y + hitObject.img.height;

            var startX = object.previousX + object.halfWidth;
            var startY = object.previousY + object.halfHeight;

            var angleOffset = 0;
            var hit = false;
            var shortestLengthSq = Infinity; 
           
            var testAngle, raycastX, raycastY, x, y, compareLength, chosenRaycastX, chosenRaycastY;

            main: while(abs(angleOffset) < 90)
            {
                testAngle = raycastAngle + angleOffset;

                raycastX = startX;
                raycastY = startY;

                // We might want to jump to inside the box of the hitObject for performance
                // but let's get this working first!
                while(raycastX < hitLeft || raycastX > hitRight || 
                      raycastY < hitTop || raycastY > hitBottom)
                {
                    raycastX += cos(testAngle);            
                    raycastY += sin(testAngle);  
                }

                hit = false;

                // We might wanna see which object is smaller and start raycasting
                // from the smaller object for performance
                // but let's just get this working first!
                while(!hit)
                {
                    raycastX += cos(testAngle);            
                    raycastY += sin(testAngle);  
                   
                    x = 0 | (raycastX - hitObject.x);
                    y = 0 | (raycastY - hitObject.y);

                    if(x < 0 || x >= imgData.width || y < 0 || y >= imgData.height)
                    {
                        angleOffset = angleOffset + (angleOffset < 0 ? -1 : 1);
                        angleOffset = -angleOffset;
                        continue main;
                    } 

                    hit = imgData.data[(x + y * imgData.width << 2) + 3] !== 0;
                }

                compareLength = Math.pow(raycastX - startX, 2) + Math.pow(raycastY - startY, 2); 
                if(compareLength < shortestLengthSq)
                {
                    chosenRaycastX = raycastX;
                    chosenRaycastY = raycastY;
                    shortestLengthSq = compareLength;
                }

                ellipse(raycastX, raycastY, 3, 3);

                angleOffset = angleOffset + (angleOffset < 0 ? -1 : 1);
                angleOffset = -angleOffset;
            }

            fill(0, 200, 17);
            ellipse(chosenRaycastX, chosenRaycastY, 6, 6);

            // Maybe I have to do a bunch of raycasts with an fov of a ~180 aiming at the default raycast
            // angle of both previous and final positions
            // I'll probably need to get the raycast that has traveled the smallest distance and use that to place our point
            // I might need to update it accordingly from it's center positions to it's origin for the object

            // We'll use this to get the center position for now, it might not be accurate though.
            // var raycastX = object.previousX + object.halfWidth;
            // var raycastY = object.previousY + object.halfHeight;

            // var raycastSpeed = 1;

            // var imgData = hitObject.img.imageData;

            // var hit = false;

            // var hitLeft = hitObject.x,
            //     hitRight = hitObject.x + hitObject.img.width;

            // var hitTop = hitObject.y,
            //     hitBottom = hitObject.y + hitObject.img.height;

            // // We might want to jump to inside the box of the hitObject for performance
            // // but let's get this working first!
            // while(raycastX < hitLeft || raycastX > hitRight || 
            //       raycastY < hitTop || raycastY > hitBottom)
            // {
            //     raycastX += cos(raycastAngle) * raycastSpeed;            
            //     raycastY += sin(raycastAngle) * raycastSpeed;  
            // }

            // var x;
            // var y;
            // var i;

            // // We might wanna see which object is smaller and start raycasting
            // // from the smaller object for performance
            // // but let's just get this working first!
            // while(!hit)
            // {
            //     raycastX += cos(raycastAngle) * raycastSpeed;            
            //     raycastY += sin(raycastAngle) * raycastSpeed;  
               
            //     x = 0 | (raycastX - hitObject.x);
            //     y = 0 | (raycastY - hitObject.y);

            //     hit = imgData.data[((x + y * imgData.width) << 2) + 3] !== 0;
            // }

            // fill(200, 0, 0);
            // ellipse(raycastX, raycastY, 3, 3);

            // window.raycastX = raycastX;
            // window.raycastY = raycastY;

            // object.x = object.previousX;
            // object.y = object.previousY;
        };

        this.run = function(object, hitObject)
        {   
            if(this.colliding(object, hitObject))
            {
                if(object.previousX !== undefined && object.previousY !== undefined)
                {
                    this.solveCollison(object, hitObject);
                }
            }else{
                object.previousX = object.x;
                object.previousY = object.y;
            }
        };
    };

    var pixelObserver = new PixelObserver();

    var cam = new Camera(0, 0, width, height);

    var player = new Player(500, 500, 40, 90);

    player.img = createGraphics(player.width, player.height, P2D);

    player.img.background(0, 0, 0, 0);
    player.img.noStroke();
    player.img.fill(2, 130, 126);
    player.img.rect(0, 0, 14, 35, 10);
    player.img.ellipse(20, 40, 30, 30);
    player.img.rect(0, 40, 40, 20);
    player.img.rect(27, 10, 13, 30);

    player.img.loadPixels();
    player.img.updatePixels();

    var ground = new Ground(0, 300, 400, 300);

    ground.img = createGraphics(ground.width, ground.height, P2D);
    
    ground.img.background(0, 0, 0, 0);
    ground.img.noStroke();
    ground.img.fill(4, 23, 134);
    // ground.img.beginShape();
    //     ground.img.vertex(0, 40);
    //     ground.img.vertex(150, 40);
    //     ground.img.vertex(240, 0);
    //     ground.img.vertex(350, 90);
    //     ground.img.vertex(400, 100);
    //     ground.img.vertex(400, 200);
    //     ground.img.vertex(30, 200);
    // ground.img.endShape();

    ground.img.loadPixels();

    draw = function()
    {
        background(15, 165, 200);

        pushMatrix();
            cam.follow(player);
            ground.draw();
            player.draw();
            player.update();

            pixelObserver.run(player, ground);
        popMatrix();

        if(mouseIsPressed && keys[" "])
        {
            if(mouseButton === LEFT)
            {
                ground.img.loadPixels();

                var r, a, i;

                var data = ground.img.imageData.data;

                var startX = mouseX + cam.focusX - cam.halfWidth - ground.x;
                var startY = mouseY + cam.focusY - cam.halfHeight - ground.y;

                var x, y;

                for(r = 0; r < 12; r++)
                {
                    for(a = 0; a < 360; a++)
                    {
                        x = (0 | (startX + cos(a) * r));
                        y = (0 | (startY + sin(a) * r));

                        if(x >= 0 && x < ground.width && y >= 0 && y < ground.height)
                        {
                            i = x + y * ground.img.imageData.width << 2;

                            data[i] = 4;
                            data[i + 1] = 23;
                            data[i + 2] = 134;
                            data[i + 3] = 255;
                        }
                    }
                }

                ground.img.updatePixels();
            }
            else if(mouseButton === RIGHT)
            {
                ground.img.loadPixels();

                var r, a, i;

                var data = ground.img.imageData.data;

                var startX = mouseX + cam.focusX - cam.halfWidth - ground.x;
                var startY = mouseY + cam.focusY - cam.halfHeight - ground.y;

                var x, y;

                for(r = 0; r < 12; r++)
                {
                    for(a = 0; a < 360; a++)
                    {
                        x = (0 | (startX + cos(a) * r));
                        y = (0 | (startY + sin(a) * r));

                        if(x >= 0 && x < ground.width && y >= 0 && y < ground.height)
                        {
                            i = x + y * ground.img.imageData.width << 2;

                            data[i] = 0;
                            data[i + 1] = 0;
                            data[i + 2] = 0;
                            data[i + 3] = 0;
                        }
                    }
                }

                ground.img.updatePixels();
            }
        }
    };
}

createProcessing(main);