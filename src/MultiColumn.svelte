<script>
  import { slide } from "svelte/transition";
  import ExpandableItem from "./ExpandableItem.svelte";

  var Mailchimp = require("mailchimp-api-v3");

  let columnImages = "";
  let columnUrls = "";
  let apiKeyDialog;
  let imagesPerRow = 3;
  let columnsHGap = 0;
  let columnsVGap = 0;
  let folderId = 0;
  let newFolderName = "";

  let columnBetweenBorderThickness = 0;
  let columnBetweenBorderStyle = "solid";
  let columnBetweenBorderColor = "#aaaaaa";
  let columnBetweenBorderPaddingTop = 0;
  let columnBetweenBorderPaddingBottom = 0;

  let columnCopiedToClipboardTxt = "Click to copy";

  let uploading = false;

  let filesToUpload = [];
  let folders = [];

  let imageStyle =
    "display: block; width: {columnWidth}px; margin: {setGap}; padding: 0; line-height: 1;";
  let aStyle =
    "text-decoration: none; margin: 0; padding: 0; display: block; line-height: 1;";

  $: parsedImageStyle = imageStyle.replace("{columnWidth}", colWidth);

  let maxWidth = 600;
  let apiKey = "";
  let connState;
  $: splitImages = columnImages.trimEnd().split("\n");
  $: splitUrls = columnUrls.trimEnd().split("\n");

  $: colWidth = Math.floor(
    (maxWidth - (imagesPerRow - 1) * columnsHGap) / imagesPerRow
  );

  $: columnItems = splitImages.map((i) => {
    let index = splitImages.indexOf(i);
    return { image: i, url: splitUrls[index] };
  });

  $: columnItemsChunked = new Array(
    Math.ceil(columnItems.length / imagesPerRow)
  )
    .fill()
    .map((_, i) =>
      columnItems.slice(i * imagesPerRow, i * imagesPerRow + imagesPerRow)
    );

  $: columnSeparatorTd =
    columnsHGap > 0
      ? `<td style="padding: 0; margin: 0; border: 0; padding: 0 ${columnsHGap}px 0 0;"></td>`
      : "";

  $: getColChildItems = (source) =>
    source
      .map(
        (
          item
        ) => `<td style="border: 0; padding: 0; margin: 0;">\n\t<a href="${item.url}" style="${aStyle}">\n\t\t<img src="${item.image}" style="padding: 0; margin: 0; display: block; ${parsedImageStyle}" />
      </a></td>`
      )
      .join(`${columnSeparatorTd}\n`);

  $: columnOutputCode =
    '<div class="mcnTextContent" style="text-align: center; margin: 0; padding: 0; line-height: 0;"><table style="border-collapse: collapse; margin: 0; padding: 0;">' +
    columnItemsChunked
      .map(
        (item) =>
          `<tr style="border: 0; padding: 0; margin: 0;">\n${getColChildItems(
            item
          )}\n</tr>`
      )
      .join(`${columnBetweenBorder}\n`) +
    "</table></div>";

  $: columnBetweenBorder = `\n<tr style="border: 0; padding: 0; margin: 0;"><td colspan="${
    columnsHGap > 0 ? imagesPerRow + (imagesPerRow - 1) : imagesPerRow
  }" style="padding: 0; padding-top: ${columnBetweenBorderPaddingTop}px; height: 0; ${
    columnBetweenBorderThickness > 0
      ? `border-bottom: ${columnBetweenBorderThickness}px ${columnBetweenBorderStyle} ${columnBetweenBorderColor};`
      : "border: 0;"
  }"></td></tr><tr style="border: 0; padding: 0; margin: 0;"><td colspan="${imagesPerRow}" style="padding: 0; padding-top: ${columnBetweenBorderPaddingBottom}px; height: 0; border: 0;}"></td></tr>`;

  let columnOutputTextArea;

  const columnSelectCode = (e) => {
    columnOutputTextArea.select();
    columnOutputTextArea.setSelectionRange(0, 99999);
    document.execCommand("copy");
    columnCopiedToClipboardTxt = "Copied to clipboard";
    setTimeout(() => (columnCopiedToClipboardTxt = "Click to copy"), 2000);
  };

  let previewDebug = false;

  const toBase64 = () => {
    filesToUpload = [...uploadElement.files];

    if (filesToUpload.length > 10) {
      alert("Select up to 10 files!");
      return;
    }

    uploading = true;

    for (let piece of chunk(filesToUpload, 10)) {
      for (let file of piece) {
        let reader = new FileReader();
        reader.onloadend = async () => {
          const readerResult = reader.result;
          currentBase64 = readerResult.substring(
            reader.result.indexOf("base64,") + 7
          );
          await doUpload(file.name, currentBase64);

          filesToUpload.shift();

          if (filesToUpload.length == 0) {
            uploadElement.value = "";
            uploading = false;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getFolderList = async () => {
    const mailChimp = new Mailchimp(apiKey);

    let r = await mailChimp.get("/file-manager/folders");

    console.log(r);

    let tempFolders = [{ id: 0, name: "Main folder" }];

    for (let folder of r.folders) {
      tempFolders.push({ id: folder.id, name: folder.name });
    }

    folders = [...tempFolders];
  };

  const addFolder = async () => {
    const mailChimp = new Mailchimp(apiKey);

    let r = await mailChimp.post("/file-manager/folders", {
      name: newFolderName,
    });

    alert("Folder added!");
    newFolderName = "";
    getFolderList();
  };

  const doUpload = async (fileName, fileBase64) => {
    const mailChimp = new Mailchimp(apiKey);

    let r = await mailChimp.post("/file-manager/files", {
      folder_id: folderId,
      name: fileName,
      file_data: fileBase64,
    });

    const newImageUrl = r.full_size_url;

    columnImages += newImageUrl;
    columnImages += "\n";
    columnUrls += "#";
    columnUrls += "\n";

    currentBase64 = null;
    currentFileName = null;
  };

  let uploadElement;

  let currentBase64;
  let currentFileName;

  const testConnection = async (e) => {
    const response = await client.ping.get();
    connState = "✔ connected";
  };

  const setUp = () => {
    const mailchimp = new Mailchimp(apiKey);
    mailchimp.get({ path: "/ping" }).then((r) => {
      if (r.statusCode === 200) {
        connState = "✔ connected";
        apiKeyDialog.close();
        getFolderList();
      }
    });
  };

  const chunk = (arr, chunkSize) => {
    let R = [];
    for (let i = 0, len = arr.length; i < len; i += chunkSize)
      R.push(arr.slice(i, i + chunkSize));
    return R;
  };
</script>

<style>
  p {
    margin: 0;
    padding: 0;
  }

  h3 {
    margin-top: 1rem;
  }

  label {
    margin: 0.25rem 0;
  }

  .connectedBtn {
    text-align: left;
    border: 1px solid var(--connection);
  }

  .connectedBtn:hover {
    background-color: var(--connection);
    color: #fff;
  }

  aside.uploading {
    opacity: 0.5;
    pointer-events: none;
  }
</style>

<div class="sidebar-grid">
  <main>
    <h1>Multi-column images</h1>

    <div class="flex">
      <label for="inputImages">Images</label>
      <label for="inputUrls">URLs</label>
      <textarea
        disabled={uploading}
        id="inputImages"
        bind:value={columnImages} />
      <textarea disabled={uploading} id="inputUrls" bind:value={columnUrls} />
    </div>

    <span>{colWidth}px</span>

    {#if uploading}
      <div transition:slide class="sk-fading-circle">
        <div class="sk-circle1 sk-circle" />
        <div class="sk-circle2 sk-circle" />
        <div class="sk-circle3 sk-circle" />
        <div class="sk-circle4 sk-circle" />
        <div class="sk-circle5 sk-circle" />
        <div class="sk-circle6 sk-circle" />
        <div class="sk-circle7 sk-circle" />
        <div class="sk-circle8 sk-circle" />
        <div class="sk-circle9 sk-circle" />
        <div class="sk-circle10 sk-circle" />
        <div class="sk-circle11 sk-circle" />
        <div class="sk-circle12 sk-circle" />
      </div>
      <span>Uploading</span>
      <br />
    {/if}

    {#if splitImages.length != splitUrls.length}
      <small
        style="margin-top: 0.5rem; display: inline-block;"
        transition:slide
        class="warning">
        Number of records in both columns should be equal!
      </small>
    {/if}

    {#if splitImages.length > 0 && columnImages.length > 0 && !uploading}
      <h3 transition:slide style="margin: 1rem 0">Preview</h3>
      <div transition:slide class="preview" style="width: {maxWidth}px">
        {@html columnOutputCode}
      </div>
    {/if}
  </main>

  <aside class:uploading>
    <div class="item">
      {#if connState == null}
        <button
          style="text-align: left"
          on:click={() => apiKeyDialog.showModal()}>Connect to Mailchimp API <br />
          <small style="opacity: 0.6">For easy uploads</small>
        </button>
      {:else}
        <button
          class="connectedBtn"
          on:click={() => {
            apiKey = '';
            connState = null;
          }}>Connected to MailChimp API<br />
          <small style="opacity: 0.6">Click to disconnect</small></button>

        {#if connState != null}
          <div transition:slide class="ctrl-flex" style="align-items: center">
            <input
              type="file"
              bind:this={uploadElement}
              multiple
              on:change={toBase64}
              disabled={uploading} />
          </div>
        {/if}
      {/if}
    </div>

    {#if connState != null}
      <ExpandableItem title="Upload options">
        <div class="ctrl-flex">
          <label for="folderPicker">Folder</label>
          <select id="folderPicker">
            {#each folders as folder}
              <option value={folder.id}>
                {folder.name}
                <small>(id {folder.id})</small>
              </option>
            {/each}
          </select>
        </div>

        <div class="ctrl-flex">
          <label for="newFolderName">Add a folder</label>
          <input type="text" id="newFolderName" bind:value={newFolderName} />

          <button
            disabled={newFolderName.length < 1}
            on:click={() => addFolder()}>Add folder</button>
        </div>
      </ExpandableItem>
    {/if}

    <ExpandableItem title="Container">
      <div class="ctrl-flex">
        <label for="maxWidth">Maximum width</label>
        <input
          id="maxWidth"
          type="range"
          min="100"
          max="1200"
          bind:value={maxWidth} />
        <code>{maxWidth} px</code>
        <small>(<code>{colWidth} px</code> per image)</small>
      </div>

      <div class="ctrl-flex">
        <label for="colImgsPerRow">Images per row</label>
        <input
          id="colImgsPerRow"
          type="range"
          min="1"
          max="6"
          bind:value={imagesPerRow} />
        <code>{imagesPerRow}</code>
      </div>

      <div class="ctrl-flex">
        <label for="colBrdrSpcTop">Space above row</label>
        <input
          id="colBrdrSpcTop"
          type="range"
          min="0"
          max="40"
          bind:value={columnBetweenBorderPaddingTop} />
        <code>{columnBetweenBorderPaddingTop} px</code>
      </div>
      <div class="ctrl-flex">
        <label for="colBrdrSpcBtm">Space below row</label>
        <input
          id="colBrdrSpcBtm"
          type="range"
          min="0"
          max="40"
          bind:value={columnBetweenBorderPaddingBottom} />
        <code>{columnBetweenBorderPaddingBottom} px</code>
      </div>

      <div class="ctrl-flex">
        <label for="colHgap">Horizontal gap</label>
        <input
          id="colHgap"
          type="range"
          min="0"
          max="32"
          bind:value={columnsHGap} />
        <code>{columnsHGap} px</code>
      </div>

      <div class="ctrl-flex">
        <label for="colBrdrThcc">Border</label>
        <input
          id="colBrdrThcc"
          type="range"
          min="0"
          max="10"
          bind:value={columnBetweenBorderThickness} />
        <code>{columnBetweenBorderThickness} px</code>
      </div>

      {#if columnBetweenBorderThickness > 0}
        <div transition:slide class="ctrl-flex">
          <input
            type="color"
            bind:value={columnBetweenBorderColor}
            id="bgColor" />
          <input
            style="width: 5rem"
            type="text"
            bind:value={columnBetweenBorderColor}
            maxlength="7"
            minlength="7" />
        </div>

        <div transition:slide class="ctrl-flex">
          <div
            style="height: 1px; width :32px; border-bottom: {columnBetweenBorderThickness}px {columnBetweenBorderStyle} grey" />
          <select id="containerAlign" bind:value={columnBetweenBorderStyle}>
            <option value="solid">Solid</option>
            <option value="dotted">Dotted</option>
            <option value="dashed">Dashed</option>
            <option value="double">Double</option>
            <option value="groove">Groove</option>
            <option value="ridge">Ridge</option>
          </select>
        </div>
      {/if}
    </ExpandableItem>

    <ExpandableItem title="Advanced">
      <div class="ctrl-flex">
        <label for="astyle">Style for <code>a</code> tags</label>
        <input
          style="font-family: 'Inconsolata', monospace; width: 30rem;"
          type="text"
          bind:value={aStyle}
          id="astyle" />
      </div>

      <div class="ctrl-flex">
        <label for="imgstyle">Style for <code>img</code> tags</label>
        <input
          style="font-family: 'Inconsolata', monospace; width: 30rem;"
          type="text"
          bind:value={imageStyle}
          id="imgstyle" />
      </div>

      <div class="ctrl-flex">
        <label for="__">&nbsp;</label>
        <small>
          Use <code style="color: var(--accent)">{'{columnWidth}'}</code> as a placeholder
          for the actual image width.
        </small>
      </div>
      <div class="ctrl-flex">
        <label for="___">&nbsp;</label>
        <small>
          Use <code style="color: var(--accent)">{'{setGap}'}</code> as a placeholder
          for spacing set above.
        </small>
      </div>
    </ExpandableItem>

    <ExpandableItem title="Misc">
      <div style="display: flex; align-items: baseline;">
        <small style="margin-right: 0.5rem">Clear</small>
        <button
          style="border-top-right-radius: 0; border-bottom-right-radius: 0"
          on:click={() => (columnImages = '')}>Images</button>
        <button
          style="border-radius: 0; border-left-width: 0; border-right-width: 0"
          on:click={() => (columnUrls = '')}>URLs</button>
        <button
          style="border-top-left-radius: 0; border-bottom-left-radius: 0"
          on:click={() => {
            columnImages = '';
            columnUrls = '';
          }}>Both</button>
      </div>
      <span
        style="opacity: 0.5; cursor: pointer;font-size: 0.8rem;display: inline-block;"
        on:click={() => {
          columnImages += '\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo';
          columnUrls += '\n#\n#';
        }}>Add dummy data</span>

      <span
        style="opacity: 0.5; cursor: pointer;font-size: 0.8rem;display: inline-block; margin: 0 1rem;"
        on:click={() => {
          columnImages += '\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo';
          columnUrls += '\n#\n#\n#\n#';
        }}>Add XL dummy data</span>
    </ExpandableItem>

    <div class="item">
      <span class="section-title">Code</span>

      <textarea
        bind:this={columnOutputTextArea}
        class="output"
        type="text"
        readonly
        bind:value={columnOutputCode}
        on:click={columnSelectCode} />

      <p class="copiedToClipboardTxt">{columnCopiedToClipboardTxt}</p>
    </div>
  </aside>
</div>

<dialog bind:this={apiKeyDialog}>
  <h3>Connect</h3>

  <label for="apiKeyTxt">API key</label>
  <input
    style="width: 20rem; font-family: 'Inconsolata', 'SF Mono', Menlo, Consolas, 'Courier New', Courier, monospace;"
    type="text"
    class="apiKeyField"
    id="apiKeyTxt"
    bind:value={apiKey} />

  <br />

  <div
    style="display: flex; gap: 4px; justify-content: flex-end; align-items: center; margin-top: 0.5rem;">
    <small
      style="opacity: 0.6; cursor: pointer; margin-right: auto"
      on:click={() => (apiKey = 'be378ccde22c3aa784133ae1fe4ed5ec-us2')}>Demo
      API key</small>

    <button on:click={() => apiKeyDialog.close()}>Cancel</button>
    <button disabled={apiKey.length < 1} on:click={setUp}>Connect</button>
  </div>
</dialog>
