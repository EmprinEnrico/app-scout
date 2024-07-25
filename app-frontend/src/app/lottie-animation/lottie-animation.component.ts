import { Component } from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-lottie-animation',
  standalone: true,
  imports: [LottieComponent],
  templateUrl: './lottie-animation.component.html',
  styleUrl: './lottie-animation.component.less'
})
export class LottieAnimationComponent {
  private animationItem: AnimationItem | undefined;

  options: AnimationOptions = {
    path: 'lottie/BonfireTent.json',
  loop: false,
    autoplay: true
  };

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
  }


  play(): void {
    if (this.animationItem) {
      this.animationItem.play();
    }
  }

  pause(): void {
    if (this.animationItem) {
      this.animationItem.pause();
    }
  }

  stop(): void {
    if (this.animationItem) {
      this.animationItem.stop();
    }
  }
}
