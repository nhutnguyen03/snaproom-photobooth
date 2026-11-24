export class CameraEngine {
  constructor(video) {
    this.video = video;
    this.stream = null;
    this.facingMode = "user";
  }

  async start({ facingMode = "user", deviceId } = {}) {
    if (!window.isSecureContext) throw new Error("INSECURE_CONTEXT");
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("UNSUPPORTED");

    const video = {
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    };
    if (deviceId) {
      video.deviceId = { exact: deviceId };
    } else {
      video.facingMode = { ideal: facingMode };
    }

    const previousStream = this.stream;
    const previousFacingMode = this.facingMode;
    const stream = await navigator.mediaDevices.getUserMedia({
      video,
      audio: false
    });
    this.stream = stream;
    this.facingMode = facingMode;
    this.video.srcObject = stream;
    try {
      await this.video.play();
    } catch (error) {
      for (const track of stream.getTracks()) track.stop();
      this.stream = previousStream;
      this.facingMode = previousFacingMode;
      this.video.srcObject = previousStream;
      throw error;
    }
    if (previousStream) {
      for (const track of previousStream.getTracks()) track.stop();
    }
  }

  stop() {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    this.video.srcObject = null;
  }

  getVideoTrack() {
    return this.stream?.getVideoTracks()[0] || null;
  }

  async switchCamera(facingMode) {
    await this.start({ facingMode });
  }

  async selectDevice(deviceId) {
    await this.start({ deviceId });
  }

  async applyConstraints(constraints) {
    const track = this.getVideoTrack();
    if (!track) return false;
    await track.applyConstraints(constraints);
    return true;
  }

  async captureAsBlob({ mirror = false, mimeType = "image/jpeg", quality = 0.82 } = {}) {
    if (!this.video.videoWidth) throw new Error("CAMERA_NOT_READY");

    const canvas = document.createElement("canvas");
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    context.save();
    if (mirror) {
      context.translate(width, 0);
      context.scale(-1, 0);
    }
    context.drawImage(this.video, 0, 0, width, height);
    context.restore();

    return await canvasToBlob(canvas, mimeType, quality);
  }
}

export function getCameraErrorMessage(error) {
  if (error?.message === "INSECURE_CONTEXT") {
    return "Camera cần HTTPS hoặc localhost. Mở bằng Live Server hoặc triển khai HTTPS.";
  }
  if (error?.message === "UNSUPPORTED") {
    return "Trình duyệt này không hỗ trợ truy cập camera.";
  }
  if (error?.name === "NotAllowedError") {
    return "Bạn chưa cấp quyền camera. Hãy cho phép truy cập camera trong trình duyệt.";
  }
  if (error?.name === "NotFoundError") {
    return "Không tìm thấy camera trên thiết bị.";
  }
  if (error?.name === "NotReadableError") {
    return "Camera đang được ứng dụng khác sử dụng.";
  }
  return "Không thể mở camera. Hãy thử lại hoặc kiểm tra thiết bị.";
}

export function canvasToBlob(canvas, mimeType = "image/jpeg", quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("CANVAS_TO_BLOB_UNSUPPORTED"));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("IMAGE_ENCODING_FAILED"));
    }, mimeType, quality);
  });
}
