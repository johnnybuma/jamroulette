import { Controller } from "@hotwired/stimulus";
import { DirectUpload } from "@rails/activestorage";

interface ActiveStorageBlob extends Blob {
  signed_id: string;
}



export default class extends Controller {
  static classes = ["active", "progressLoading", "progressDone"];
  static targets = ["uploadModal", "uploadForm", "fileField", "fileName", "durationField", "bpmField", "progressBar"];


  toggleModal() {
    // Using type assertion for accessing the target
    const uploadModal = this.targets.find("uploadModal") as HTMLElement;
    uploadModal.classList.toggle((this as any).activeClass);
  }



  uploadFile(file: File): void {
    const fileField = this.targets.find("fileField") as HTMLInputElement;
    const uploadForm = this.targets.find("uploadForm") as HTMLFormElement;
    const url = fileField.dataset.directUploadUrl;
    const upload = new DirectUpload(file, url);

    upload.create((error, blob) => {
      if (error) {
        throw new Error('Direct Upload Error - ' + error);
      } else {
        const activeStorageBlob = blob as unknown as ActiveStorageBlob;
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("value", activeStorageBlob.signed_id);
        hiddenField.name = fileField.name; // Use the name from the fileField
        uploadForm.appendChild(hiddenField); // Append to the uploadForm
      }
    });
  }


  submitForm() {
    // Using type assertion to access the uploadFormTarget
    const uploadForm = this.targets.find("uploadForm") as HTMLFormElement;
    uploadForm.submit();
  }

  setFilename(name: string): void {
    // Using type assertion to access the fileNameTarget
    const fileName = this.targets.find("fileName") as HTMLElement;
    fileName.textContent = name;
  }

  setDuration(duration: number): void {
    // Using type assertion to access the durationFieldTarget
    const durationField = this.targets.find("durationField") as HTMLInputElement;
    durationField.value = duration.toString();
  }


  isAudioWithDuration(file: File): boolean {
    return file.type.startsWith("audio/") && !(file.type === "audio/midi" || file.type === "audio/x-midi");
  }

  browserHasAudioContext(): boolean {
    const browserAudioContext = window.AudioContext || window["webkitAudioContext"] || null;
    return !(browserAudioContext == null);
  }

  extractDurationFromAudioFile(file: File): void {
    const audioContext = new AudioContext();
    file.arrayBuffer().then(fileBuffer => {
      audioContext.decodeAudioData(fileBuffer).then(decodedAudioData => {
        this.setDuration(decodedAudioData.duration);
      });
    });
  }

  fileSelected() {
    const fileField = this.targets.find("fileField") as HTMLInputElement;
    const progressBar = this.targets.find("progressBar") as HTMLProgressElement;
    const bpmField = this.targets.find("bpmField") as HTMLInputElement;

    if (fileField.files && fileField.files.length > 0) {
      const fileToUpload = fileField.files[0];
      this.setFilename(fileToUpload.name);

      if (this.isAudioWithDuration(fileToUpload) && this.browserHasAudioContext()) {
        this.extractDurationFromAudioFile(fileToUpload);
      }

      const directUploadController = new DirectUploadController(this, fileToUpload, progressBar);
      directUploadController.start();

      fileField.value = null; // Clear the file input
      bpmField.focus(); // Set focus to the BPM field
    }
  }

}

class DirectUploadController {
  directUpload: DirectUpload;
  source: Controller;
  file: File;
  xhr: XMLHttpRequest;
  hiddenInput: HTMLInputElement;
  progressBar: HTMLProgressElement;

  constructor(source: Controller, file: File, progressBar: HTMLProgressElement) {
    // Using type assertion to get the fileField target
    const fileField = source.targets.find("fileField") as HTMLInputElement;
    this.directUpload = new DirectUpload(file, fileField.dataset.directUploadUrl, this);
    this.source = source;
    this.progressBar = progressBar;
    this.file = file;
  }

  public start(): void {
    this.hiddenInput = this.createHiddenInput();
    this.uploadRequestStarted();

    // Using type assertion to get the fileField target
    const fileField = this.source.targets.find("fileField") as HTMLInputElement;

    this.directUpload.create((error, blob) => {
      if (error) {
        this.removeElement(this.hiddenInput);
      } else {
        const activeStorageBlob = blob as unknown as ActiveStorageBlob;
        this.hiddenInput.value = activeStorageBlob.signed_id;
        this.hiddenInput.name = fileField.name; // Use the name from fileField
      }
    });
  }


  private bindProgressEvent(xhr: XMLHttpRequest): void {
    this.xhr = xhr;
    this.xhr.upload.addEventListener("progress", event => this.uploadRequestDidProgress(event));
    this.xhr.addEventListener("load", () => this.uploadRequestFinished());
  }

  private uploadRequestStarted(): void {
    this.progressBar.value = 0;
    this.progressBar.classList.remove((this.source as any).progressDoneClass);
    this.progressBar.classList.add((this.source as any).progressLoadingClass);
  }

  private uploadRequestFinished(): void {
    this.progressBar.classList.remove((this.source as any).progressLoadingClass);
    this.progressBar.classList.add((this.source as any).progressDoneClass);
  }

  private uploadRequestDidProgress(event): void {
    const progress = (event.loaded / event.total) * 100;
    this.progressBar.value = progress;
  }

  private createHiddenInput(): HTMLInputElement {
    const hiddenField = document.createElement('input');
    hiddenField.setAttribute("type", "hidden");

    // Using type assertion to access the uploadFormTarget
    const uploadForm = this.source.targets.find("uploadForm") as HTMLFormElement;
    uploadForm.appendChild(hiddenField);

    return hiddenField;
  }


  private removeElement(element: HTMLElement): void {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}
