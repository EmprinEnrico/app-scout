import { Component, Input, OnInit } from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-lottie-animation',
  standalone: true,
  imports: [LottieComponent],
  templateUrl: './lottie-animation.component.html',
  styleUrl: './lottie-animation.component.less'
})
export class LottieAnimationComponent implements OnInit{
  private animationItem: AnimationItem | undefined;

  @Input() path: string = '';
  @Input() loop: boolean = true;
  @Input() autoplay: boolean = true;

  options: AnimationOptions = {
    path: '',
    loop: true,
    autoplay: true
  };

  ngOnInit(): void {
    this.options = {
      path: this.path,
      loop: this.loop,
      autoplay: this.autoplay
    };
  }

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
