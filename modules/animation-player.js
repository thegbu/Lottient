export class AnimationController {
    constructor(containerId) {
        this.containerId = containerId;
        this.anim = null;
        this.playerState = {
            isPaused: true,
            currentFrame: 0.0,
        };
    }

    loadAnimation(animData, onDOMLoaded, onEnterFrame) {
        if (this.anim) {
            this.playerState.currentFrame = this.anim.currentFrame;
            this.anim.destroy();
            document.getElementById(this.containerId).innerHTML = "";
        }

        const shouldPlayAfterReload = true;

        this.anim = window.lottie.loadAnimation({
            container: document.getElementById(this.containerId),
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: JSON.parse(JSON.stringify(animData)),
        });

        this.playerState.isPaused = false;

        this.anim.addEventListener("DOMLoaded", () => {
            if (onDOMLoaded) {
                onDOMLoaded(this.anim.totalFrames);
            }
        });

        this.anim.addEventListener("enterFrame", () => {
            if (onEnterFrame) {
                onEnterFrame(this.anim.currentFrame);
            }
        });

        return shouldPlayAfterReload;
    }

    togglePlay() {
        if (!this.anim) return this.playerState.isPaused;

        if (this.anim.isPaused) {
            this.anim.play();
            this.playerState.isPaused = false;
        } else {
            this.anim.pause();
            this.playerState.isPaused = true;
        }

        return this.playerState.isPaused;
    }

    goToFrame(frame, pause = false) {
        if (!this.anim) return;

        this.playerState.currentFrame = frame;

        if (pause) {
            this.anim.goToAndStop(frame, true);
            this.playerState.isPaused = true;
        } else {
            this.anim.goToAndPlay(frame, true);
            this.playerState.isPaused = false;
        }
    }

    pause() {
        if (this.anim && !this.anim.isPaused) {
            this.anim.pause();
            this.playerState.isPaused = true;
        }
    }
}
