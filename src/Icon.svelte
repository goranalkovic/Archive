<script>
  export let name;
</script>

{#if name == 'maxWidth'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-maxWidth">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="maxWidth" clip-path="url(#clip-maxWidth)">
      <g id="Group_3" data-name="Group 3" transform="translate(0 5.5)">
        <line
          id="Line_4"
          data-name="Line 4"
          x2="12"
          transform="translate(2.5 8)"
          fill="none"
          stroke="#176efc"
          stroke-linecap="round"
          stroke-width="1.5" />
        <g id="Group_1" data-name="Group 1">
          <line
            id="Line_5"
            data-name="Line 5"
            x2="2"
            y2="1.5"
            transform="translate(1 8)"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
          <line
            id="Line_6"
            data-name="Line 6"
            y1="1.5"
            x2="2"
            transform="translate(1 6.5)"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
        </g>
        <g id="Group_2" data-name="Group 2" transform="translate(13 6.5)">
          <line
            id="Line_5-2"
            data-name="Line 5"
            x1="2"
            y2="1.5"
            transform="translate(0 1.5)"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
          <line
            id="Line_6-2"
            data-name="Line 6"
            x1="2"
            y1="1.5"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
        </g>
      </g>
      <g
        id="Rectangle_1"
        data-name="Rectangle 1"
        transform="translate(2 1)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="12" height="8" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="13" height="9" rx="1" fill="none" />
      </g>
    </g>
  </svg>
{:else if name == 'imgsPerRow'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-imgPerRow">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="imgPerRow" clip-path="url(#clip-imgPerRow)">
      <g
        id="Rectangle_1"
        data-name="Rectangle 1"
        transform="translate(1 2)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
      <rect
        id="Rectangle_2"
        data-name="Rectangle 2"
        width="5.5"
        height="10"
        rx="0.5"
        transform="translate(2 3)"
        fill="#176efc" />
      <rect
        id="Rectangle_3"
        data-name="Rectangle 3"
        width="5.5"
        height="10"
        rx="0.5"
        transform="translate(8.5 3)"
        fill="#176efc" />
    </g>
  </svg>
{:else if name == 'topSpace'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-topSpc">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="topSpc" clip-path="url(#clip-topSpc)">
      <g
        id="Rectangle_1"
        data-name="Rectangle 1"
        transform="translate(1 -11)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
      <rect
        id="Rectangle_2"
        data-name="Rectangle 2"
        width="12.5"
        height="7"
        rx="0.5"
        transform="translate(2 8)"
        fill="#176efc"
        opacity="0.4" />
      <g
        id="Rectangle_4"
        data-name="Rectangle 4"
        transform="translate(1 15)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
      <g
        id="Group_4"
        data-name="Group 4"
        transform="translate(6.5 6.5) rotate(-90)">
        <line
          id="Line_5"
          data-name="Line 5"
          x1="2"
          y2="1.5"
          transform="translate(0 1.5)"
          fill="none"
          stroke="#176efc"
          stroke-linecap="round"
          stroke-width="1.5" />
        <line
          id="Line_6"
          data-name="Line 6"
          x1="2"
          y1="1.5"
          fill="none"
          stroke="#176efc"
          stroke-linecap="round"
          stroke-width="1.5" />
      </g>
    </g>
  </svg>
{:else if name == 'bottomSpace'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-btmSpc">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="btmSpc" clip-path="url(#clip-btmSpc)">
      <rect
        id="Rectangle_2"
        data-name="Rectangle 2"
        width="12.5"
        height="7"
        rx="0.5"
        transform="translate(2 1)"
        fill="#176efc"
        opacity="0.4" />
      <g
        id="Rectangle_1"
        data-name="Rectangle 1"
        transform="translate(1 -11)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
      <g
        id="Rectangle_4"
        data-name="Rectangle 4"
        transform="translate(1 15)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
      <g
        id="Group_4"
        data-name="Group 4"
        transform="translate(9.5 9.5) rotate(90)">
        <line
          id="Line_5"
          data-name="Line 5"
          x1="2"
          y1="1.5"
          fill="none"
          stroke="#176efc"
          stroke-linecap="round"
          stroke-width="1.5" />
        <line
          id="Line_6"
          data-name="Line 6"
          x1="2"
          y2="1.5"
          transform="translate(0 1.5)"
          fill="none"
          stroke="#176efc"
          stroke-linecap="round"
          stroke-width="1.5" />
      </g>
    </g>
  </svg>
{:else if name == 'horGap'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-horGap">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="horGap" clip-path="url(#clip-horGap)">
      <g
        id="Rectangle_4"
        data-name="Rectangle 4"
        transform="translate(15 1)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="12" height="14" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="13" height="15" rx="1" fill="none" />
      </g>
      <g
        id="Rectangle_1"
        data-name="Rectangle 1"
        transform="translate(-11 1)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="12" height="14" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="13" height="15" rx="1" fill="none" />
      </g>
      <rect
        id="Rectangle_2"
        data-name="Rectangle 2"
        width="10"
        height="7"
        rx="0.5"
        transform="translate(3 2)"
        fill="#176efc"
        opacity="0.4" />
      <g id="Group_5" data-name="Group 5" transform="translate(3 4.5)">
        <line
          id="Line_4"
          data-name="Line 4"
          x2="6"
          transform="translate(2.5 8)"
          fill="none"
          stroke="#176efc"
          stroke-linecap="round"
          stroke-width="1.5" />
        <g id="Group_1" data-name="Group 1">
          <line
            id="Line_5"
            data-name="Line 5"
            x2="2"
            y2="1.5"
            transform="translate(1 8)"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
          <line
            id="Line_6"
            data-name="Line 6"
            y1="1.5"
            x2="2"
            transform="translate(1 6.5)"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
        </g>
        <g id="Group_2" data-name="Group 2" transform="translate(7.5 6.5)">
          <line
            id="Line_5-2"
            data-name="Line 5"
            x1="2"
            y2="1.5"
            transform="translate(0 1.5)"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
          <line
            id="Line_6-2"
            data-name="Line 6"
            x1="2"
            y1="1.5"
            fill="none"
            stroke="#176efc"
            stroke-linecap="round"
            stroke-width="1.5" />
        </g>
      </g>
    </g>
  </svg>
{:else if name == 'border'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-border">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="border" clip-path="url(#clip-border)">
      <rect
        id="Rectangle_2"
        data-name="Rectangle 2"
        width="14.5"
        height="1"
        rx="0.5"
        transform="translate(1 7.5)"
        fill="#176efc" />
      <g
        id="Rectangle_1"
        data-name="Rectangle 1"
        transform="translate(1 -9)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
      <g
        id="Rectangle_4"
        data-name="Rectangle 4"
        transform="translate(1 13)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="12" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="13" rx="1" fill="none" />
      </g>
    </g>
  </svg>
{:else if name == 'aStyle'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-aStyle">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="aStyle" clip-path="url(#clip-aStyle)">
      <path
        id="Path_2"
        data-name="Path 2"
        d="M-.528.121a1.994,1.994,0,0,1-1.315-.39A1.263,1.263,0,0,1-2.31-1.287a1.487,1.487,0,0,1,.192-.753,1.75,1.75,0,0,1,.55-.578A2.875,2.875,0,0,1-.7-3,4.368,4.368,0,0,1,.44-3.135q.132,0,.281.006t.319.016l.346.022.033.781q-.154-.022-.325-.033T.759-2.354H.451a3.969,3.969,0,0,0-.743.061,1.608,1.608,0,0,0-.517.181.812.812,0,0,0-.3.3.816.816,0,0,0-.1.407.743.743,0,0,0,.066.325.523.523,0,0,0,.181.215.852.852,0,0,0,.275.116,1.475,1.475,0,0,0,.346.039A1.572,1.572,0,0,0,.3-.836a1.238,1.238,0,0,0,.467-.357,1.608,1.608,0,0,0,.291-.594,3.174,3.174,0,0,0,.1-.842,2.925,2.925,0,0,0-.148-1.045.926.926,0,0,0-.435-.517,1.592,1.592,0,0,0-.715-.143,2,2,0,0,0-.677.115,1.728,1.728,0,0,0-.633.424l-.583-.66a2.569,2.569,0,0,1,.919-.572A3.079,3.079,0,0,1-.088-5.2a3.315,3.315,0,0,1,.9.115,1.913,1.913,0,0,1,.726.379,1.7,1.7,0,0,1,.484.715,3.272,3.272,0,0,1,.171,1.144V0H1.045V-.627a1.663,1.663,0,0,1-.319.368,1.405,1.405,0,0,1-.379.231A1.856,1.856,0,0,1-.077.088,3.037,3.037,0,0,1-.528.121Z"
        transform="translate(7.91 10.703)"
        fill="#176efc" />
      <g
        id="Rectangle_5"
        data-name="Rectangle 5"
        transform="translate(1 1)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="14" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="15" rx="1" fill="none" />
      </g>
    </g>
  </svg>
{:else if name == 'imgStyle'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="16"
    height="16"
    viewBox="0 0 16 16">
    <defs>
      <clipPath id="clip-imgStyle">
        <rect width="16" height="16" />
      </clipPath>
    </defs>
    <g id="imgStyle" clip-path="url(#clip-imgStyle)">
      <path
        id="Path_1"
        data-name="Path 1"
        d="M-5.2,0V-.713h1.035V-3.458h-.99v-.711h1.89V-.713h.945V0Zm1.431-4.914a.557.557,0,0,1-.409-.166.536.536,0,0,1-.167-.391.549.549,0,0,1,.162-.405.561.561,0,0,1,.414-.162.568.568,0,0,1,.41.171.537.537,0,0,1,.176.4.523.523,0,0,1-.176.391A.576.576,0,0,1-3.771-4.916ZM-1.953,0V-4.167h.765v.342a1.058,1.058,0,0,1,.22-.238,1.028,1.028,0,0,1,.261-.148.779.779,0,0,1,.283-.054A.755.755,0,0,1-.117-4.2a.747.747,0,0,1,.252.18A.744.744,0,0,1,.3-3.717a.984.984,0,0,1,.22-.3A.981.981,0,0,1,.824-4.2,1.031,1.031,0,0,1,1.2-4.266a.772.772,0,0,1,.374.086.751.751,0,0,1,.261.234,1.036,1.036,0,0,1,.153.36,1.8,1.8,0,0,1,.041.473V0H1.242V-2.88a2.221,2.221,0,0,0-.036-.468.37.37,0,0,0-.1-.207.245.245,0,0,0-.158-.054.361.361,0,0,0-.257.122.9.9,0,0,0-.2.328A1.316,1.316,0,0,0,.414-2.7V0H-.342V-2.844a1.626,1.626,0,0,0-.076-.621.272.272,0,0,0-.266-.153.307.307,0,0,0-.176.059.584.584,0,0,0-.158.171.921.921,0,0,0-.112.275,1.569,1.569,0,0,0-.041.378V0ZM4.239,1.584a3.909,3.909,0,0,1-.783-.072,2.058,2.058,0,0,1-.6-.211A1.012,1.012,0,0,1,2.484.959.843.843,0,0,1,2.358.5.837.837,0,0,1,2.466.081a1.11,1.11,0,0,1,.288-.329,1.327,1.327,0,0,1,.4-.211l.4.18a2.289,2.289,0,0,0-.252.18.66.66,0,0,0-.167.2.568.568,0,0,0-.058.266A.336.336,0,0,0,3.159.6a.654.654,0,0,0,.252.162,1.906,1.906,0,0,0,.387.1A3.208,3.208,0,0,0,4.3.9,2.332,2.332,0,0,0,4.914.832.79.79,0,0,0,5.279.639.4.4,0,0,0,5.4.351.413.413,0,0,0,5.328.094a.476.476,0,0,0-.27-.144A2.531,2.531,0,0,0,4.482-.1Q4.176-.1,3.9-.122a2.756,2.756,0,0,1-.5-.086A1.69,1.69,0,0,1,3-.369a.756.756,0,0,1-.266-.247.648.648,0,0,1-.095-.356.809.809,0,0,1,.162-.49,1.9,1.9,0,0,1,.4-.4l.4.252q-.081.09-.144.153a.678.678,0,0,0-.1.122A.261.261,0,0,0,3.33-1.2a.233.233,0,0,0,.135.2A1.159,1.159,0,0,0,3.9-.882a7.117,7.117,0,0,0,.806.036,2.484,2.484,0,0,1,.706.085,1.1,1.1,0,0,1,.446.239.866.866,0,0,1,.229.346,1.291,1.291,0,0,1,.068.428,1.177,1.177,0,0,1-.108.491,1.191,1.191,0,0,1-.338.427,1.725,1.725,0,0,1-.594.3A3,3,0,0,1,4.239,1.584ZM4.122-1.4A1.562,1.562,0,0,1,3.339-1.6,1.432,1.432,0,0,1,2.8-2.115a1.394,1.394,0,0,1-.194-.729A1.418,1.418,0,0,1,2.8-3.578,1.421,1.421,0,0,1,3.339-4.1a1.562,1.562,0,0,1,.783-.194,1.581,1.581,0,0,1,.792.194,1.421,1.421,0,0,1,.535.522,1.418,1.418,0,0,1,.194.734,1.394,1.394,0,0,1-.194.729,1.432,1.432,0,0,1-.535.518A1.581,1.581,0,0,1,4.122-1.4Zm0-.675a.776.776,0,0,0,.4-.1.719.719,0,0,0,.27-.275.783.783,0,0,0,.1-.391.752.752,0,0,0-.1-.391A.73.73,0,0,0,4.514-3.5a.783.783,0,0,0-.391-.1.741.741,0,0,0-.378.1.764.764,0,0,0-.275.27.733.733,0,0,0-.1.387.765.765,0,0,0,.1.383.753.753,0,0,0,.27.279A.733.733,0,0,0,4.122-2.079Zm1.269-1.35-.342-.423a1.913,1.913,0,0,1,.571-.329,1.656,1.656,0,0,1,.688-.086l.09.639a1.911,1.911,0,0,0-.54,0A1.045,1.045,0,0,0,5.391-3.429Z"
        transform="translate(7.452 10.291)"
        fill="#176efc" />
      <g
        id="Rectangle_5"
        data-name="Rectangle 5"
        transform="translate(1 1)"
        fill="none"
        stroke="gray"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1">
        <rect width="14" height="14" rx="0.5" stroke="none" />
        <rect x="-0.5" y="-0.5" width="15" height="15" rx="1" fill="none" />
      </g>
    </g>
  </svg>
{/if}
