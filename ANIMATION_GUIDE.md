# 🎬 Animation Guide - Hướng dẫn sử dụng Animation mới

Các animation mới đã được thêm vào `AnimationManager`:

## 1. 🎯 Circle Animation - Vòng tròn phóng to thu nhỏ

### Tính năng:
- 2 vòng tròn chạy animation phóng to thu nhỏ
- Có thể tùy chỉnh kích thước, màu sắc, tốc độ
- Theo dõi vị trí player tự động

### Cách sử dụng:

```typescript
import { AnimationManager, CircleAnimationConfig } from './managers/AnimationManager';

// Khởi tạo
const animationManager = AnimationManager.getInstance();
animationManager.initWithApp(app);

// Tạo circle animation
const circleConfig: CircleAnimationConfig = {
    size: 100,              // Kích thước vòng tròn
    playerX: 400,           // Vị trí X của player
    playerY: 300,           // Vị trí Y của player
    color: 0x00FFFF,        // Màu sắc (hex)
    alpha: 0.6,             // Độ trong suốt (0-1)
    speed: 0.08,            // Tốc độ animation
    minScale: 0.8,          // Scale tối thiểu
    maxScale: 1.2           // Scale tối đa
};

const circleAnimation = animationManager.createCircleAnimation(circleConfig);
app.stage.addChild(circleAnimation);

// Update vị trí theo player
animationManager.updateCirclePosition(circleAnimation, newPlayerX, newPlayerY);

// Remove animation
animationManager.removeCircleAnimation(circleAnimation);
```

## 2. ⚠️ Warning Animation - Cảnh báo nhấp nháy

### Tính năng:
- warning_bg và txt_warning nhấp nháy đồng bộ
- Tùy chỉnh tốc độ và độ trong suốt

### Cách sử dụng:

```typescript
import { BlinkAnimationConfig } from './managers/AnimationManager';

// Tạo warning animation
const warningConfig: BlinkAnimationConfig = {
    speed: 0.15,            // Tốc độ nhấp nháy
    minAlpha: 0.3,          // Alpha tối thiểu
    maxAlpha: 1.0           // Alpha tối đa
};

const warningAnimation = await animationManager.createWarningAnimation(warningConfig);
warningAnimation.position.set(400, 150);
app.stage.addChild(warningAnimation);

// Remove animation
animationManager.removeWarningAnimation(warningAnimation);
```

## 3. 📚 Tutorial Animation - Hướng dẫn nhấp nháy

### Tính năng:
- txt_tutorial nhấp nháy mềm mại
- Tùy chỉnh tốc độ và độ trong suốt

### Cách sử dụng:

```typescript
// Tạo tutorial animation
const tutorialConfig: BlinkAnimationConfig = {
    speed: 0.06,            // Tốc độ nhấp nháy (chậm hơn warning)
    minAlpha: 0.5,          // Alpha tối thiểu
    maxAlpha: 1.0           // Alpha tối đa
};

const tutorialAnimation = await animationManager.createTutorialAnimation(tutorialConfig);
tutorialAnimation.position.set(400, 450);
app.stage.addChild(tutorialAnimation);

// Remove animation
animationManager.removeTutorialAnimation(tutorialAnimation);
```

## 4. 🧹 Cleanup Animations

### Remove tất cả animations:

```typescript
// Remove individual animations
animationManager.removeCircleAnimation(circleContainer);
animationManager.removeWarningAnimation(warningContainer);
animationManager.removeTutorialAnimation(tutorialSprite);

// Hoặc remove generic animation
animationManager.removeAnimation(anyAnimatedSprite);
```

## 5. 🎮 Ví dụ thực tế

```typescript
import { AnimationExamples } from './examples/AnimationExamples';

// Trong game loop
class GameScene {
    private animationExamples: AnimationExamples;
    
    constructor(app: Application) {
        this.animationExamples = new AnimationExamples(app);
    }
    
    // Khi player level up
    onPlayerLevelUp() {
        const circleAnimation = this.animationExamples.createCircleAnimationExample();
        // Tự động remove sau 3 giây
        setTimeout(() => {
            this.animationManager.removeCircleAnimation(circleAnimation);
        }, 3000);
    }
    
    // Khi có nguy hiểm
    onDangerWarning() {
        const warningAnimation = await this.animationExamples.createWarningAnimationExample();
        // Remove sau 5 giây
        setTimeout(() => {
            this.animationManager.removeWarningAnimation(warningAnimation);
        }, 5000);
    }
    
    // Khi hiển thị tutorial
    onShowTutorial() {
        const tutorialAnimation = await this.animationExamples.createTutorialAnimationExample();
        // Giữ lại cho đến khi player đọc xong
    }
}
```

## 6. 🎨 Tùy chỉnh Animation

### Circle Animation presets:

```typescript
// Player power-up effect
const powerUpCircle = animationManager.createCircleAnimation({
    size: 150,
    color: 0xFFD700,        // Vàng
    speed: 0.1,
    minScale: 0.9,
    maxScale: 1.5
});

// Enemy targeting
const targetCircle = animationManager.createCircleAnimation({
    size: 80,
    color: 0xFF0000,        // Đỏ
    speed: 0.12,
    minScale: 0.7,
    maxScale: 1.1
});

// Healing area
const healCircle = animationManager.createCircleAnimation({
    size: 200,
    color: 0x00FF00,        // Xanh lá
    speed: 0.04,
    minScale: 0.95,
    maxScale: 1.05
});
```

### Warning Animation variations:

```typescript
// Urgent warning
const urgentWarning = await animationManager.createWarningAnimation({
    speed: 0.25,            // Nhanh
    minAlpha: 0.1,
    maxAlpha: 1.0
});

// Gentle warning
const gentleWarning = await animationManager.createWarningAnimation({
    speed: 0.08,            // Chậm
    minAlpha: 0.6,
    maxAlpha: 0.9
});
```

## 7. 🔧 Lưu ý kỹ thuật

1. **Performance**: Các animation sử dụng `app.ticker`, nhớ cleanup để tránh memory leak
2. **Assets**: Warning và Tutorial cần file texture tương ứng:
   - `/assets/textures/ui/warning_bg.png`
   - `/assets/textures/ui/txt_warning.png`
   - `/assets/textures/ui/txt_tutorial.png`
3. **Sync**: Circle animation tự động sync với player position nếu cung cấp playerX, playerY

## 8. 📱 Demo

Chạy demo đầy đủ:

```typescript
const demo = new AnimationExamples(app);
await demo.runFullDemo();
```

---

🎉 **Chúc bạn tạo ra những animation tuyệt vời!** 🎉 