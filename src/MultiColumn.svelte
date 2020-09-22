<script>
  import { slide } from "svelte/transition";
  import ExpandableItem from "./ExpandableItem.svelte";
  import { flip } from "svelte/animate";
  import Icon from "./Icon.svelte";

  var Mailchimp = require("mailchimp-api-v3");

  const placeholderImage =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADCCAMAAAB6zFdcAAAAQlBMVEX///+hoaGenp6amprHx8f39/fOzs7j4+P7+/uYmJjT09OlpaXv7+/29va6urq1tbWvr6/AwMDn5+fd3d2xsbGqqqp20Q+8AAACjklEQVR4nO3b6XLCIBSG4QQ0qzHG5f5vtY1byEaiZMY5Z97nX1ukwydSOKFRBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADq7av9hqrs1+P5wjG3mzKHX4/oY5mNt2V2vx7SxzJDBv8ZmA0/wokRmsGG3ZEBGbTIQH4GVVJfm3NYd8IzKKz5Z+ugvxKyMyiemyVzCulOdAb7917JFgHdic6g6PaLt4DuRGfQdBmE7BvJQHgGSZdBGdCd6AwO7zP0wiAy7ywRnYHzYfAOssnzxvNj2RlER9umYGJvHeho/DsI4RlEl1Nsyp13Fjw2Up5hSs+g/crf+LVo2HSuhYIMFpTvdbOaaaE+g27ZNNeZJtozuDgl6LmRKs+g6lWg7XShQXkGt34VfnpHrTuD3eBBhKmnWqnOIB09j5qsM2jOYD/xOMpO7Cg1ZXAejO80+Uhu/Do9GVSltVd3zUsmIzDH0SvVZJCV7cnIKamdZx5Oj5cENRkc7++6aZw2M0aXDbRk8Kqy28vzG/V8BsP6q5IMDt2p4HEySjzXNMygoKIkg7LL4F4sOXhvqrwny4OODJwC8+NkVM4H4EyWJxUZXHrvuk2fC6Qng96SoCGDajji6Z1BLwR30BoyuA2HvOLKVu5U1hRkMDwcruMco+VnkObfROAW28Vn8PVdRZO8uhCfwfXr+5rvypr0DJb/BHhkrz5EZzB3OFzlVVmTnUG2sB9c8DxGy85g/nC4cibcj9GiMyiC7/Dfr25IzsB/OFw3EdrKmuAMsvh+QTNMXojO4JBuQnQGm5GaQZxsp5aaQfhS0JH4/0zRBothT9B15x8577aVLP9KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDuD7d6G0PBTSbxAAAAAElFTkSuQmCC";

  let columnImages = "";
  let columnUrls = "";
  let apiKeyDialog;
  let imagesPerRow = 3;
  let columnsHGap = 0;
  let folderId = 0;
  let newFolderName = "";
  let batchDialog;
  let hovering = false;

  const drop = (event, target) => {
    event.dataTransfer.dropEffect = "move";
    const start = parseInt(event.dataTransfer.getData("text/plain"));
    const newTracklist = columnImgData;

    if (start < target) {
      newTracklist.splice(target + 1, 0, newTracklist[start]);
      newTracklist.splice(start, 1);
    } else {
      newTracklist.splice(target, 0, newTracklist[start]);
      newTracklist.splice(start + 1, 1);
    }
    columnImgData = newTracklist;
    hovering = null;
  };

  const dragstart = (event, i) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.dropEffect = "move";
    const start = i;
    event.dataTransfer.setData("text/plain", start);
  };

  let columnImgData = [];

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
    Math.ceil(columnImgData.length / imagesPerRow)
  )
    .fill()
    .map((_, i) =>
      columnImgData.slice(i * imagesPerRow, i * imagesPerRow + imagesPerRow)
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
        ) => `<td style="border: 0; padding: 0; margin: 0;">\n\t<a href="${item.url}" style="${aStyle}">\n\t\t<img src="${item.img}" style="padding: 0; margin: 0; display: block; ${parsedImageStyle}" />
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

  const copyText = (txt) => {
    let tempInput = document.createElement('input');
    tempInput.value = txt;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
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

  const getId = () => "_" + Math.random().toString(36).substr(2, 9);

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

    columnImgData = [
      ...columnImgData,
      {
        img: newImageUrl,
        url: "#",
        id: getId(),
      },
    ];

    // columnImages += newImageUrl;
    // columnImages += "\n";
    // columnUrls += "#";
    // columnUrls += "\n";

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

  let colBatchImgs = "";
  let colBatchUrls = "";

  const doBatchEdit = () => {
    colBatchImgs = "";
    colBatchUrls = "";

    for (let item of columnImgData) {
      colBatchImgs += `${item.img}\n`;
      colBatchUrls += `${item.url}\n`;
    }

    colBatchImgs = colBatchImgs.trimEnd();
    colBatchUrls = colBatchUrls.trimEnd();

    batchDialog.showModal();
  };

  const saveBatchEdits = () => {
    let splitImages = colBatchImgs.split("\n");
    let splitUrls = colBatchUrls.split("\n");

    if (splitImages.length !== splitUrls.length) {
      alert("Fields should have the same number of items");
      return;
    }

    for (let i in columnImgData) {
      columnImgData[i].img = splitImages[i];
      columnImgData[i].url = splitUrls[i];
    }

    for (let i = columnImgData.length; i < splitImages.length; i++) {
      columnImgData = [
        ...columnImgData,
        {
          img: splitImages[i],
          url: splitUrls[i],
          id: getId(),
        },
      ];
    }

    batchDialog.close();
  };

  let colCurrentEditImg;
  let editImgDialog;

  const editColImg = (imgIndex) => {
    colCurrentEditImg = imgIndex;
    editImgDialog.showModal();
  };

  const deleteCurrentImg = () => {
    columnImgData = columnImgData.filter((el) => el != colCurrentEditImg);
    editImgDialog.close();
  };

  const addImage = () => {
    columnImgData = [...columnImgData, { img: "", url: "", id: getId() }];

    colCurrentEditImg = columnImgData.length - 1;

    editImgDialog.showModal();
  };

  const getColTempImgData = async () => {
    let currentUrl = columnImgData[colCurrentEditImg].img;

    if (currentUrl.length < 11) return placeholderImage;

    let data = await fetch(currentUrl, { method: "HEAD" });

    console.log(data);
    if (data.ok) {
      return currentUrl;
    }
    return placeholderImage;
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

  .list img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    border-radius: 3px;
    margin: 0;
    padding: 0;
    display: block;
  }

  .list {
    display: grid;

    gap: 0.5rem;
  }

  .list-item {
    padding: 0.25rem;
    border-radius: 6px;
    transition: 0.3s background-color, 0.3s border;
    border: 1px solid #eee;
    margin: 0;
    display: block;
  }

  .list-item:not(.is-active):hover {
    border: 1px solid var(--accent) !important;
  }

  .list-item.is-active {
    background-color: var(--accent);
    color: #fff;
  }

  .list-item.is-active img {
    opacity: 0.6;
  }

  .list-upload button {
    color: #aaa;
    border: 1px dashed #bbb;
  }

  .list-upload button:hover {
    background-color: #fcfcfc;
  }

  .list-upload input,
  .list-upload button {
    height: 100%;
    width: 100%;
  }

  .list-upload input:disabled,
  .list-upload button:disabled {
    opacity: 0.5 !important;
    pointer-events: none !important;
  }

  .colDialogImgPreview {
    height: 10rem;
    width: 10rem;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }
</style>

<div class="sidebar-grid">
  <main>
    <h1>Multi-column images</h1>

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

    <div>
      <button disabled={uploading} on:click={addImage}>Add an image</button>

      <button disabled={uploading} on:click={doBatchEdit}>Batch edit</button>
    </div>

    <div
      class="list"
      style="grid-template-columns: repeat({imagesPerRow}, 7rem); grid-auto-rows: 7rem;">
      {#each columnImgData as n, index (n.id)}
        <a
          on:click|preventDefault={() => editColImg(index)}
          href={n.url}
          class="list-item"
          animate:flip={{ duration: 250 }}
          draggable={true}
          on:dragstart={(event) => dragstart(event, index)}
          on:drop|preventDefault={(event) => drop(event, index)}
          ondragover="return false"
          on:dragenter={() => (hovering = index)}
          class:is-active={hovering === index}>
          <img src={n.img} alt="Test" />
        </a>
      {/each}
      {#if connState != null}
        <div transition:slide class="list-upload">
          <input
            type="file"
            bind:this={uploadElement}
            multiple
            on:change={toBase64}
            disabled={uploading} />
        </div>
      {/if}
    </div>

    {#if columnImgData.length > 0 && !uploading}
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
        <label for="maxWidth"><Icon name="maxWidth" />
          Maximum width</label>
        <div class="side-by-side">
          <input
            id="maxWidth"
            type="range"
            min="100"
            max="1200"
            bind:value={maxWidth} />
          <code>{maxWidth} px</code>
        </div>

        <small style="font-size: 0.75rem"><code>{colWidth} px</code> per image</small>
      </div>

      <div class="ctrl-flex">
        <label for="colImgsPerRow"><Icon name="imgsPerRow" />
          Images per row</label>
        <div class="side-by-side">
          <input
            id="colImgsPerRow"
            type="range"
            min="1"
            max="6"
            bind:value={imagesPerRow} />
          <code>{imagesPerRow}</code>
        </div>
      </div>

      <div class="ctrl-flex">
        <label for="colBrdrSpcTop"><Icon name="topSpace" />
          Space above row</label>
        <div class="side-by-side">
          <input
            id="colBrdrSpcTop"
            type="range"
            min="0"
            max="40"
            bind:value={columnBetweenBorderPaddingTop} />
          <code>{columnBetweenBorderPaddingTop} px</code>
        </div>
      </div>
      <div class="ctrl-flex">
        <label for="colBrdrSpcBtm"><Icon name="bottomSpace" />
          Space below row</label>
        <div class="side-by-side">
          <input
            id="colBrdrSpcBtm"
            type="range"
            min="0"
            max="40"
            bind:value={columnBetweenBorderPaddingBottom} />
          <code>{columnBetweenBorderPaddingBottom} px</code>
        </div>
      </div>

      <div class="ctrl-flex">
        <label for="colHgap"><Icon name="horGap" />
          Horizontal gap</label>
        <div class="side-by-side">
          <input
            id="colHgap"
            type="range"
            min="0"
            max="32"
            bind:value={columnsHGap} />
          <code>{columnsHGap} px</code>
        </div>
      </div>

      <div class="ctrl-flex">
        <label for="colBrdrThcc"><Icon name="border" />
          Border</label>
        <div class="side-by-side">
          <input
            id="colBrdrThcc"
            type="range"
            min="0"
            max="10"
            bind:value={columnBetweenBorderThickness} />
          <code>{columnBetweenBorderThickness} px</code>
        </div>
        {#if columnBetweenBorderThickness > 0}
          <div transition:slide class="side-by-side">
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

          <div transition:slide class="side-by-side">
            <div
              style="height: 1px; width: 24px; border-bottom: {columnBetweenBorderThickness}px {columnBetweenBorderStyle} grey; transform: translateY(-2px)" />
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
      </div>
    </ExpandableItem>

    <ExpandableItem title="Advanced">
      <div class="ctrl-flex">
        <label for="astyle"><Icon name="aStyle" />
          Style for <code>a</code> tags</label>
        <input
          style="font-family: 'Inconsolata', monospace; width: 30rem;"
          type="text"
          bind:value={aStyle}
          id="astyle" />
      </div>

      <div class="ctrl-flex">
        <label for="imgstyle"><Icon name="imgStyle" />
          Style for <code>img</code> tags</label>
        <input
          style="font-family: 'Inconsolata', monospace; width: 30rem;"
          type="text"
          bind:value={imageStyle}
          id="imgstyle" />
      </div>

      <small>
        Use <code on:click={() => copyText('{columnWidth}')} style="color: var(--accent)">{'{columnWidth}'}</code> instead of the actual image width.
      </small>
      <br>
      <small>
        Write <code on:click={() => copyText('{setGap}')} style="color: var(--accent)">{'{setGap}'}</code> to use spacing set above.
      </small>
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
    <div style="display: flex; gap: 1rem; padding: 1rem;">
      <span
        style="opacity: 0.5; cursor: pointer;font-size: 0.8rem;"
        on:click={() => {
          columnImages += '\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo';
          columnUrls += '\n#\n#';
          columnImgData = [{ img: 'https://picsum.photos/id/10/300', url: '#', id: 0 }, { img: 'https://picsum.photos/id/20/300', url: '#', id: 1 }];
        }}>Test images x2</span>

      <span
        style="opacity: 0.5; cursor: pointer;font-size: 0.8rem;"
        on:click={() => {
          columnImages += '\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo\nhttps://yt3.ggpht.com/a/AATXAJzF-K41Fq96yE6jxs_fE6Hr7zvMXsQbqz1QNxGpjg=s88-c-k-c0xffffffff-no-rj-mo';
          columnUrls += '\n#\n#\n#\n#';
          columnImgData = [{ img: 'https://picsum.photos/id/1/300', url: '#', id: 0 }, { img: 'https://picsum.photos/id/10/300', url: '#', id: 1 }, { img: 'https://picsum.photos/id/20/300', url: '#', id: 2 }, { img: 'https://picsum.photos/id/30/300', url: '#', id: 3 }, { img: 'https://picsum.photos/id/40/300', url: '#', id: 4 }, { img: 'https://picsum.photos/id/50/300', url: '#', id: 5 }];
        }}>Test images x6</span>
    </div>
  </aside>
</div>

<dialog bind:this={batchDialog}>
  <h3>Batch edit data</h3>

  <div class="ctrl-flex">
    <label for="inputImages">Images</label>
    <textarea
      style="min-width: 440px"
      id="inputImages"
      bind:value={colBatchImgs} />
  </div>

  <div class="ctrl-flex">
    <label for="inputUrls">URLs</label>
    <textarea
      style="min-width: 440px"
      id="inputUrls"
      bind:value={colBatchUrls} />
  </div>

  <div class="dialog-actions">
    <div style="display: flex; align-items: baseline;">
      <small style="margin-right: 0.5rem">Clear</small>
      <button
        style="border-top-right-radius: 0; border-bottom-right-radius: 0"
        on:click={() => (colBatchImgs = '')}>Images</button>
      <button
        style="border-radius: 0; border-left-width: 0; border-right-width: 0"
        on:click={() => (colBatchUrls = '')}>URLs</button>
      <button
        style="border-top-left-radius: 0; border-bottom-left-radius: 0"
        on:click={() => {
          colBatchImgs = '';
          colBatchUrls = '';
        }}>Both</button>
    </div>
    <button
      style="margin-left: auto;"
      on:click={() => batchDialog.close()}>Cancel</button>
    <button on:click={saveBatchEdits}>Save</button>
  </div>
</dialog>

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

  <div class="dialog-actions">
    <small
      style="opacity: 0.6; cursor: pointer; margin-right: auto"
      on:click={() => (apiKey = 'be378ccde22c3aa784133ae1fe4ed5ec-us2')}>Demo
      API key</small>

    <button on:click={() => apiKeyDialog.close()}>Cancel</button>
    <button disabled={apiKey.length < 1} on:click={setUp}>Connect</button>
  </div>
</dialog>

<dialog bind:this={editImgDialog}>
  <h3>Edit image</h3>

  {#if colCurrentEditImg != null}
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      {#await getColTempImgData()}
        <img class="colDialogImgPreview" src={placeholderImage} alt="Loading" />
      {:then imgSrc}
        <img
          class="colDialogImgPreview"
          src={imgSrc}
          alt="Currently edited item" />
      {/await}

      <div>
        <div class="ctrl-flex">
          <label for="currImgImg">Image</label>
          <input
            style="min-width: 300px; font-size: 0.8rem; font-family: 'Inconsolata', monospaced;"
            type="text"
            bind:value={columnImgData[colCurrentEditImg].img}
            id="currImgimg" />
        </div>

        <div class="ctrl-flex">
          <label for="currImgUrl">URL</label>
          <input
            style="min-width: 300px; font-size: 0.8rem; font-family: 'Inconsolata', monospaced;"
            type="text"
            bind:value={columnImgData[colCurrentEditImg].url}
            id="currImgUrl" />
        </div>
      </div>
    </div>
  {/if}

  <div class="dialog-actions">
    <small
      style="opacity: 0.6; cursor: pointer; margin-right: auto; color: var(--error)"
      on:click={deleteCurrentImg}>Delete</small>

    {#if colCurrentEditImg != null}
      <button
        disabled={columnImgData[colCurrentEditImg].img.length < 1 || columnImgData[colCurrentEditImg].url.length < 1}
        on:click={() => editImgDialog.close()}>Save and close</button>
    {/if}
  </div>
</dialog>
