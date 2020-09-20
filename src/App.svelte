<script>
  import { slide } from "svelte/transition";
  import ButtonGenerator from "./ButtonGenerator.svelte";
  import MultiColumn from "./MultiColumn.svelte";

  let currentPage = 1;
</script>

<style>
  :global(.preview a) {
    text-decoration: none;
  }

  :global(.preview img) {
    transition: 0.3s all;
  }

  :global(input[type="checkbox"]) {
    transform: scale(1.5);
  }

  p {
    margin: 0;
    padding: 0;
  }

  .grid {
    /* display: grid;
    grid-template-rows: auto 1fr;
    grid-template-areas: "sidebar" "content"; */

    padding: 0;
    margin: 0;
    height: 100%;
    width: 100%;
    border-radius: 6px;
  }

  .content {
    grid-area: content;
    /* background-color: #fff;
    padding: 1rem; */
    /* overflow-y: scroll; */
    /* margin-top: 3rem; */
  }

  .sidebar {
    /* grid-area: sidebar; */
    position: fixed;
    top: 0;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0;
    /* background-color: #eee; */
    background-color: hsla(0, 0%, 93%, 0.8);
    min-width: 200px;
    width: 100%;
    backdrop-filter: blur(30px) saturate(125%);
    /* box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.1); */
    z-index: 1000;
    -webkit-app-region: drag;
  }

  .sidebar button:not(.macCloseBtn):not(.winCloseBtn) {
    padding: 0.5rem 0.5rem;
    margin: 0;
    border: none;
    background-color: rgba(200, 200, 200, 0);
    text-align: left;
    color: #666 !important;
    -webkit-app-region: no-drag;
  }

  .sidebar button:not(.macCloseBtn):not(.winCloseBtn):hover {
    background-color: rgba(20, 20, 20, 0.1);
    color: #000 !important;
  }

  .sidebar button:not(.macCloseBtn):not(.winCloseBtn).active {
    pointer-events: none;
    background-color: #fff;
    color: #000 !important;

    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
  }

  .macCloseBtn {
    margin: 0 0.05rem 0 0.75rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;

    background-color: #ff5c5c;
    color: #ff5c5c;
    font-size: 9pt;
    width: 13px;
    height: 13px;
    border: 1px solid #e33e41;
    border-radius: 50%;
    display: inline-block;
    font-weight: 600;

    -webkit-app-region: no-drag;
  }

  .macCloseBtn:active {
    background: #c14645;
    border: 1px solid #b03537;
    color: #790004;
  }

  .macCloseBtn:hover {
    background-color: #ff5c5c !important;
    color: #b03537 !important;
  }

  .winCloseBtn {
    margin: 0 !important;
    margin-left: auto !important;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.6rem;
    font-weight: 200;
    padding: 0 !important;
    line-height: 0;
    height: 48px;
    width: 56px;
    -webkit-app-region: no-drag;
    color: #999;
    border-radius: 1px !important;
    border: 0;
    background-color: transparent;
  }

  .winCloseBtn:hover {
    background-color: #e92739 !important;
    color: #fff !important;
  }

  .tabBtn {
    margin: 0.4rem !important;
    margin-right: 0 !important;
  }
</style>

<div class="grid">
  <div class="sidebar">
    {#if process.platform === 'darwin'}
      <button
        style="margin-right: 0.25rem;"
        class="macCloseBtn"
        on:click={() => window.close()}>✗</button>
    {/if}

    <button
      class="tabBtn"
      on:click={() => (currentPage = 1)}
      class:active={currentPage == 1}>Multi-column images</button>
    <button
      class="tabBtn"
      on:click={() => (currentPage = 2)}
      class:active={currentPage == 2}>Button generator</button>

    {#if process.platform !== 'darwin'}
      <button class="winCloseBtn" on:click={() => window.close()}>×</button>
    {/if}
  </div>

  <div class="content">
    {#if currentPage == 1}
      <div transition:slide={{ duration: 250, x: 250, y: 0 }}>
        <MultiColumn />
      </div>
    {:else if currentPage == 2}
      <div transition:slide={{ duration: 250, x: 250, y: 0 }}>
        <ButtonGenerator />
      </div>
    {/if}
  </div>
</div>
