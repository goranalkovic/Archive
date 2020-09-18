<script>
  export let title;

  let isOpen = false;
</script>

<style>
  details {
    position: relative;

    border-bottom: 1px solid #e2e8f0;
  }

  details:hover {
    cursor: pointer;
  }

  .summary-title {
    user-select: none;
    font-size: 0.85rem;
  }

  .summary-content {
    border-top: 1px solid hsl(214, 32%, 96%);
    cursor: default;
    padding: 1rem;
    font-weight: 300;
    line-height: 1.5;
  }

  summary {
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  summary:focus {
    outline: none;
  }

  summary:hover .summary-chevron-up svg {
    opacity: 1;
  }

  .summary-chevron-up svg {
    opacity: 0.5;
  }

  .summary-chevron-up {
    pointer-events: none;
    transition: 0.3s transform;
  }
  .summary-chevron-up svg {
    display: block;
    transition: 0.3s opacity;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .titleOpen {
    font-weight: 500;
  }

  .open {
    transform: scaleY(-1);
  }
</style>

<details bind:open={isOpen}>
  <summary>
    <span class="summary-title" class:titleOpen={isOpen}>{title}</span>
    <div class="summary-chevron-up" class:open={isOpen}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-chevron-down"><polyline
          points="6 9 12 15 18 9" /></svg>
    </div>
  </summary>

  <div class="summary-content">
    <slot />
  </div>
</details>
