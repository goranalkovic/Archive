<script>
  import { slide } from "svelte/transition";
  // Style

  let stylePanelOpen = false;

  let fonts = {
    Helvetica: "'Helvetica Neue', Helvetica, Arial, Verdana, sans-serif",
    Arial: "Arial, sans-serif",
    Verdana: "Verdana, Geneva, sans-serif",
    Tahoma: "Tahoma, Verdana, Segoe, sans-serif",
    TrebuchetMS:
      "'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', 'Lucida Sans', Tahoma, sans-serif",
    ComicSansMS: "'Comic Sans MS', 'Marker Felt-Thin', Arial, sans-serif",
    TimesNewRoman: "'Times New Roman', Times, Baskerville, Georgia, serif",
    Georgia: 'Georgia, Times, "Times New Roman", serif',
    Lucida: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
    CourierNew:
      "'Courier New', Courier, 'Lucida Sans Typewriter', 'Lucida Typewriter', monospace",
  };

  let padding = 18;
  let buttonMarginV = 0;
  let buttonMarginH = 0;
  let containerMarginV = 0;
  let containerMarginH = 0;
  let bgColor = "#000000";
  let textColor = "#ffffff";
  let borderRadius = 0;
  let borderColor = "#aaaaaa";
  let borderThickness = 0;
  let borderStyle = "none";
  let font = "Helvetica";
  let isBold = false;
  let isItalic = false;
  let containerTextAlign = "center";
  let buttonWidth = -1;

  $: border =
    borderStyle != "none"
      ? `border: ${borderThickness}px ${borderStyle} ${borderColor}`
      : "";

  $: buttonStyle = `display: inline-block; text-decoration: none; text-align: center; line-height: 1; padding: ${padding}px; margin: ${buttonMarginV}px ${buttonMarginH}px; border-radius: ${borderRadius}px; background: ${bgColor}; color: ${textColor}; font-family: ${
    fonts[font]
  }; font-weight: ${isBold ? 700 : 400}; ${
    isItalic ? "font-style: italic; " : ""
  }${border}${buttonWidth >= 0 ? `width: ${buttonWidth}%` : ""}`;

  // Functionality

  let buttonCaptions = "";
  let buttonUrls = "";

  $: splitButtonCaptions = buttonCaptions.trimEnd().split("\n");
  $: splitButtonUrls = buttonUrls.trimEnd().split("\n");

  $: buttonItems = splitButtonCaptions.map((i) => {
    let index = splitButtonCaptions.indexOf(i);
    return { caption: i, url: splitButtonUrls[index] };
  });

  $: buttonOutputItems = buttonItems.map(
    (item) =>
      `<a href="${item.url}" style="${buttonStyle}" target='_blank' >${item.caption}</a>`
  );

  $: buttonOutputCode = `<div class="mcnTextContent" style="text-align: ${containerTextAlign}; margin: ${containerMarginV}px ${containerMarginH}px; padding: 0;">${buttonOutputItems.join(
    ""
  )}\n</div>`;

  let buttonOutputTextArea;
  let btnCopiedToClipboardTxt = "Click to copy";

  const buttonSelectCode = (e) => {
    buttonOutputTextArea.select();
    buttonOutputTextArea.setSelectionRange(0, 99999);
    document.execCommand("copy");
    btnCopiedToClipboardTxt = "Copied to clipboard";
    setTimeout(() => (btnCopiedToClipboardTxt = "Click to copy"), 2000);
  };

  let btnContrastLevel = 21;

  const getContrast = async () => {
    let result = await fetch(
      `https://webaim.org/resources/contrastchecker/?fcolor=${textColor.replace(
        "#",
        ""
      )}&bcolor=${bgColor.replace("#", "")}&api`
    );

    let json = await result.json();

    btnContrastLevel = json.ratio;
  };
</script>

<style>
</style>

<h1>Button generator</h1>

<h3>Links</h3>

<div class="flex">
  <label for="captions">Captions</label>
  <label for="urls">URLs</label>

  <textarea id="captions" bind:value={buttonCaptions} />
  <textarea id="urls" bind:value={buttonUrls} />
</div>

<h3>Code</h3>

<textarea
  transition:slide
  bind:this={buttonOutputTextArea}
  style="height: auto; min-height: 6rem"
  class="output"
  type="text"
  readonly
  bind:value={buttonOutputCode}
  on:click={buttonSelectCode} />

<p transition:slide class="copiedToClipboardTxt">{btnCopiedToClipboardTxt}</p>

<h3>Preview</h3>

<div class="preview">
  {@html buttonOutputCode}
</div>

<h3 style="margin-top: 2rem;">Container style</h3>

<div class="ctrl-flex">
  <label for="containerAlign">Alignment</label>
  <select id="containerAlign" bind:value={containerTextAlign}>
    <option value="left">Left</option>
    <option value="center">Center</option>
    <option value="right">Right</option>
  </select>
</div>

<div class="ctrl-flex">
  <label for="_">Margin</label>
  <small style="margin-right: -0.8rem">↔</small>
  <input type="number" min="0" max="100" bind:value={containerMarginH} />
  <small style="margin-left: -0.8rem">px</small>
  <small style="margin-right: -0.8rem">↕</small>
  <input type="number" min="0" max="100" bind:value={containerMarginV} />
  <small style="margin-left: -0.8rem">px</small>
</div>

<h3 style="margin-top: 2rem;">Button style</h3>

<div class="ctrl-flex" style="margin-bottom: 2rem">
  <label for="___"><i>Preview</i></label>
  <a href="." style={buttonStyle} target="_blank">Sample button</a>
</div>

{#if btnContrastLevel < 4.5}
  <div transition:slide class="ctrl-flex">
    <label for="____" />
    <small class="warning">⚠ Color contrast insufficient ({btnContrastLevel}:1)</small>
  </div>
{/if}

<div class="ctrl-flex">
  <label for="bgColor">Background color</label>
  <input
    type="color"
    bind:value={bgColor}
    on:change={() => getContrast()}
    id="bgColor" />
  <input
    style="width: 5rem"
    type="text"
    bind:value={bgColor}
    on:change={() => getContrast()}
    maxlength="7"
    minlength="7" />
</div>

<div class="ctrl-flex">
  <label for="txtColor">Text color</label>
  <input
    type="color"
    bind:value={textColor}
    on:change={() => getContrast()}
    id="txtColor"
    maxlength="7"
    minlength="7" />
  <input
    style="width: 5rem"
    type="text"
    bind:value={textColor}
    on:change={() => getContrast()}
    pattern="#.{6}" />
</div>

<div class="ctrl-flex">
  <label for="fontFamily">Font</label>
  <select name="font" id="font" bind:value={font}>
    {#each Object.entries(fonts) as [key, value], i}
      <option
        style="padding: 0.25rem 0.5rem; margin: 0.25rem 0; height: 1.5rem; font-size: 1rem; font-family: {value}"
        value={key}>
        {key}
      </option>
    {/each}
  </select>
  <button
    class="toggleBtn"
    class:toggled={isBold}
    on:click={() => (isBold = !isBold)}>Bold</button>
  <button
    class="toggleBtn"
    class:toggled={isItalic}
    on:click={() => (isItalic = !isItalic)}>Italic</button>
</div>

<div class="ctrl-flex">
  <label for="padding">Padding</label>
  <input type="number" min="0" max="100" bind:value={padding} id="padding" />
  <small style="margin-left: -0.8rem">px</small>
</div>

<div class="ctrl-flex">
  <label for="__">Margin</label>
  <small style="margin-right: -0.8rem">↔</small>
  <input type="number" min="0" max="100" bind:value={buttonMarginH} />
  <small style="margin-left: -0.8rem">px</small>
  <small style="margin-right: -0.8rem">↕</small>
  <input type="number" min="0" max="100" bind:value={buttonMarginV} />
  <small style="margin-left: -0.8rem">px</small>
</div>

<div class="ctrl-flex">
  <label for="borderRadius">Corner radius</label>
  <input
    type="range"
    min="0"
    max="50"
    bind:value={borderRadius}
    id="borderRadius" />
  <code>{borderRadius} px</code>
</div>

<div class="ctrl-flex">
  <label for="btnWidth">Button width (%)</label>

  <input
    type="range"
    min="-1"
    max="100"
    bind:value={buttonWidth}
    id="btnWidth" />
  <code>{buttonWidth >= 0 ? `${buttonWidth}%` : 'Automatic'}</code>
</div>
