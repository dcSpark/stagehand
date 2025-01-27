export declare const scriptContent = "(() => {\n  // lib/dom/xpathUtils.ts\n  function getParentElement(node) {\n    return isElementNode(node) ? node.parentElement : node.parentNode;\n  }\n  function getCombinations(attributes, size) {\n    const results = [];\n    function helper(start, combo) {\n      if (combo.length === size) {\n        results.push([...combo]);\n        return;\n      }\n      for (let i = start; i < attributes.length; i++) {\n        combo.push(attributes[i]);\n        helper(i + 1, combo);\n        combo.pop();\n      }\n    }\n    helper(0, []);\n    return results;\n  }\n  function isXPathFirstResultElement(xpath, target) {\n    try {\n      const result = document.evaluate(\n        xpath,\n        document.documentElement,\n        null,\n        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,\n        null\n      );\n      return result.snapshotItem(0) === target;\n    } catch (error) {\n      console.warn(`Invalid XPath expression: ${xpath}`, error);\n      return false;\n    }\n  }\n  function escapeXPathString(value) {\n    if (value.includes(\"'\")) {\n      if (value.includes('\"')) {\n        return \"concat(\" + value.split(/('+)/).map((part) => {\n          if (part === \"'\") {\n            return `\"'\"`;\n          } else if (part.startsWith(\"'\") && part.endsWith(\"'\")) {\n            return `\"${part}\"`;\n          } else {\n            return `'${part}'`;\n          }\n        }).join(\",\") + \")\";\n      } else {\n        return `\"${value}\"`;\n      }\n    } else {\n      return `'${value}'`;\n    }\n  }\n  async function generateXPathsForElement(element) {\n    if (!element) return [];\n    const [complexXPath, standardXPath, idBasedXPath] = await Promise.all([\n      generateComplexXPath(element),\n      generateStandardXPath(element),\n      generatedIdBasedXPath(element)\n    ]);\n    return [standardXPath, ...idBasedXPath ? [idBasedXPath] : [], complexXPath];\n  }\n  async function generateComplexXPath(element) {\n    const parts = [];\n    let currentElement = element;\n    while (currentElement && (isTextNode(currentElement) || isElementNode(currentElement))) {\n      if (isElementNode(currentElement)) {\n        const el = currentElement;\n        let selector = el.tagName.toLowerCase();\n        const attributePriority = [\n          \"data-qa\",\n          \"data-component\",\n          \"data-role\",\n          \"role\",\n          \"aria-role\",\n          \"type\",\n          \"name\",\n          \"aria-label\",\n          \"placeholder\",\n          \"title\",\n          \"alt\"\n        ];\n        const attributes = attributePriority.map((attr) => {\n          let value = el.getAttribute(attr);\n          if (attr === \"href-full\" && value) {\n            value = el.getAttribute(\"href\");\n          }\n          return value ? { attr: attr === \"href-full\" ? \"href\" : attr, value } : null;\n        }).filter((attr) => attr !== null);\n        let uniqueSelector = \"\";\n        for (let i = 1; i <= attributes.length; i++) {\n          const combinations = getCombinations(attributes, i);\n          for (const combo of combinations) {\n            const conditions = combo.map((a) => `@${a.attr}=${escapeXPathString(a.value)}`).join(\" and \");\n            const xpath2 = `//${selector}[${conditions}]`;\n            if (isXPathFirstResultElement(xpath2, el)) {\n              uniqueSelector = xpath2;\n              break;\n            }\n          }\n          if (uniqueSelector) break;\n        }\n        if (uniqueSelector) {\n          parts.unshift(uniqueSelector.replace(\"//\", \"\"));\n          break;\n        } else {\n          const parent = getParentElement(el);\n          if (parent) {\n            const siblings = Array.from(parent.children).filter(\n              (sibling) => sibling.tagName === el.tagName\n            );\n            const index = siblings.indexOf(el) + 1;\n            selector += siblings.length > 1 ? `[${index}]` : \"\";\n          }\n          parts.unshift(selector);\n        }\n      }\n      currentElement = getParentElement(currentElement);\n    }\n    const xpath = \"//\" + parts.join(\"/\");\n    return xpath;\n  }\n  async function generateStandardXPath(element) {\n    const parts = [];\n    while (element && (isTextNode(element) || isElementNode(element))) {\n      let index = 0;\n      let hasSameTypeSiblings = false;\n      const siblings = element.parentElement ? Array.from(element.parentElement.childNodes) : [];\n      for (let i = 0; i < siblings.length; i++) {\n        const sibling = siblings[i];\n        if (sibling.nodeType === element.nodeType && sibling.nodeName === element.nodeName) {\n          index = index + 1;\n          hasSameTypeSiblings = true;\n          if (sibling.isSameNode(element)) {\n            break;\n          }\n        }\n      }\n      if (element.nodeName !== \"#text\") {\n        const tagName = element.nodeName.toLowerCase();\n        const pathIndex = hasSameTypeSiblings ? `[${index}]` : \"\";\n        parts.unshift(`${tagName}${pathIndex}`);\n      }\n      element = element.parentElement;\n    }\n    return parts.length ? `/${parts.join(\"/\")}` : \"\";\n  }\n  async function generatedIdBasedXPath(element) {\n    if (isElementNode(element) && element.id) {\n      return `//*[@id='${element.id}']`;\n    }\n    return null;\n  }\n\n  // lib/dom/utils.ts\n  async function waitForDomSettle() {\n    return new Promise((resolve) => {\n      const createTimeout = () => {\n        return setTimeout(() => {\n          resolve();\n        }, 2e3);\n      };\n      let timeout = createTimeout();\n      const observer = new MutationObserver(() => {\n        clearTimeout(timeout);\n        timeout = createTimeout();\n      });\n      observer.observe(window.document.body, { childList: true, subtree: true });\n    });\n  }\n  window.waitForDomSettle = waitForDomSettle;\n  function calculateViewportHeight() {\n    return Math.ceil(window.innerHeight * 0.75);\n  }\n  function canElementScroll(elem) {\n    if (typeof elem.scrollTo !== \"function\") {\n      console.warn(\"canElementScroll: .scrollTo is not a function.\");\n      return false;\n    }\n    try {\n      const originalTop = elem.scrollTop;\n      elem.scrollTo({\n        top: originalTop + 100,\n        left: 0,\n        behavior: \"instant\"\n      });\n      if (elem.scrollTop === originalTop) {\n        throw new Error(\"scrollTop did not change\");\n      }\n      elem.scrollTo({\n        top: originalTop,\n        left: 0,\n        behavior: \"instant\"\n      });\n      return true;\n    } catch (error) {\n      console.warn(\"canElementScroll error:\", error.message || error);\n      return false;\n    }\n  }\n\n  // lib/dom/GlobalPageContainer.ts\n  var GlobalPageContainer = class {\n    getViewportHeight() {\n      return calculateViewportHeight();\n    }\n    getScrollHeight() {\n      return document.documentElement.scrollHeight;\n    }\n    async scrollTo(offset) {\n      await new Promise((resolve) => setTimeout(resolve, 1500));\n      window.scrollTo({ top: offset, left: 0, behavior: \"smooth\" });\n      await this.waitForScrollEnd();\n    }\n    async waitForScrollEnd() {\n      return new Promise((resolve) => {\n        let scrollEndTimer;\n        const handleScroll = () => {\n          clearTimeout(scrollEndTimer);\n          scrollEndTimer = window.setTimeout(() => {\n            window.removeEventListener(\"scroll\", handleScroll);\n            resolve();\n          }, 100);\n        };\n        window.addEventListener(\"scroll\", handleScroll, { passive: true });\n        handleScroll();\n      });\n    }\n  };\n\n  // lib/dom/ElementContainer.ts\n  var ElementContainer = class {\n    constructor(el) {\n      this.el = el;\n    }\n    getViewportHeight() {\n      return this.el.clientHeight;\n    }\n    getScrollHeight() {\n      return this.el.scrollHeight;\n    }\n    async scrollTo(offset) {\n      await new Promise((resolve) => setTimeout(resolve, 1500));\n      this.el.scrollTo({ top: offset, left: 0, behavior: \"smooth\" });\n      await this.waitForScrollEnd();\n    }\n    async waitForScrollEnd() {\n      return new Promise((resolve) => {\n        let scrollEndTimer;\n        const handleScroll = () => {\n          clearTimeout(scrollEndTimer);\n          scrollEndTimer = window.setTimeout(() => {\n            this.el.removeEventListener(\"scroll\", handleScroll);\n            resolve();\n          }, 100);\n        };\n        this.el.addEventListener(\"scroll\", handleScroll, { passive: true });\n        handleScroll();\n      });\n    }\n  };\n\n  // lib/dom/containerFactory.ts\n  function createStagehandContainer(obj) {\n    if (obj instanceof Window) {\n      return new GlobalPageContainer();\n    } else {\n      return new ElementContainer(obj);\n    }\n  }\n\n  // lib/dom/process.ts\n  function isElementNode(node) {\n    return node.nodeType === Node.ELEMENT_NODE;\n  }\n  function isTextNode(node) {\n    return node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim());\n  }\n  function getMainScrollableElement() {\n    const docEl = document.documentElement;\n    let mainScrollable = docEl;\n    const rootScrollDiff = docEl.scrollHeight - docEl.clientHeight;\n    let maxScrollDiff = rootScrollDiff;\n    const allElements = document.querySelectorAll(\"*\");\n    for (const elem of allElements) {\n      const style = window.getComputedStyle(elem);\n      const overflowY = style.overflowY;\n      const isPotentiallyScrollable = overflowY === \"auto\" || overflowY === \"scroll\" || overflowY === \"overlay\";\n      if (isPotentiallyScrollable) {\n        const candidateScrollDiff = elem.scrollHeight - elem.clientHeight;\n        if (candidateScrollDiff > maxScrollDiff) {\n          maxScrollDiff = candidateScrollDiff;\n          mainScrollable = elem;\n        }\n      }\n    }\n    if (mainScrollable !== docEl) {\n      if (!canElementScroll(mainScrollable)) {\n        console.log(\n          \"Stagehand (Browser Process): Unable to scroll candidate. Fallback to <html>.\"\n        );\n        mainScrollable = docEl;\n      }\n    }\n    return mainScrollable;\n  }\n  async function processDom(chunksSeen) {\n    const { chunk, chunksArray } = await pickChunk(chunksSeen);\n    const container = createStagehandContainer(window);\n    const { outputString, selectorMap } = await processElements(\n      chunk,\n      true,\n      0,\n      container\n    );\n    console.log(\n      `Stagehand (Browser Process): Extracted dom elements:\n${outputString}`\n    );\n    return {\n      outputString,\n      selectorMap,\n      chunk,\n      chunks: chunksArray\n    };\n  }\n  async function processAllOfDom() {\n    console.log(\"Stagehand (Browser Process): Processing all of DOM\");\n    const mainScrollable = getMainScrollableElement();\n    const container = mainScrollable === document.documentElement ? createStagehandContainer(window) : createStagehandContainer(mainScrollable);\n    const viewportHeight = container.getViewportHeight();\n    const documentHeight = container.getScrollHeight();\n    const totalChunks = Math.ceil(documentHeight / viewportHeight);\n    let index = 0;\n    const results = [];\n    for (let chunk = 0; chunk < totalChunks; chunk++) {\n      const result = await processElements(chunk, true, index, container);\n      results.push(result);\n      index += Object.keys(result.selectorMap).length;\n    }\n    await container.scrollTo(0);\n    const allOutputString = results.map((result) => result.outputString).join(\"\");\n    const allSelectorMap = results.reduce(\n      (acc, result) => ({ ...acc, ...result.selectorMap }),\n      {}\n    );\n    console.log(\n      `Stagehand (Browser Process): All dom elements: ${allOutputString}`\n    );\n    return {\n      outputString: allOutputString,\n      selectorMap: allSelectorMap\n    };\n  }\n  var xpathCache = /* @__PURE__ */ new Map();\n  async function processElements(chunk, scrollToChunk = true, indexOffset = 0, container) {\n    console.time(\"processElements:total\");\n    const stagehandContainer = container ?? createStagehandContainer(window);\n    const viewportHeight = stagehandContainer.getViewportHeight();\n    const totalScrollHeight = stagehandContainer.getScrollHeight();\n    const chunkHeight = viewportHeight * chunk;\n    const maxScrollTop = totalScrollHeight - viewportHeight;\n    const offsetTop = Math.min(chunkHeight, maxScrollTop);\n    if (scrollToChunk) {\n      console.time(\"processElements:scroll\");\n      await stagehandContainer.scrollTo(offsetTop);\n      console.timeEnd(\"processElements:scroll\");\n    }\n    console.log(\"Stagehand (Browser Process): Generating candidate elements\");\n    console.time(\"processElements:findCandidates\");\n    const DOMQueue = [...document.body.childNodes];\n    const candidateElements = [];\n    while (DOMQueue.length > 0) {\n      const element = DOMQueue.pop();\n      let shouldAddElement = false;\n      if (element && isElementNode(element)) {\n        const childrenCount = element.childNodes.length;\n        for (let i = childrenCount - 1; i >= 0; i--) {\n          const child = element.childNodes[i];\n          DOMQueue.push(child);\n        }\n        if (isInteractiveElement(element)) {\n          if (isActive(element) && isVisible(element)) {\n            shouldAddElement = true;\n          }\n        }\n        if (isLeafElement(element)) {\n          if (isActive(element) && isVisible(element)) {\n            shouldAddElement = true;\n          }\n        }\n      }\n      if (element && isTextNode(element) && isTextVisible(element)) {\n        shouldAddElement = true;\n      }\n      if (shouldAddElement) {\n        candidateElements.push(element);\n      }\n    }\n    console.timeEnd(\"processElements:findCandidates\");\n    const selectorMap = {};\n    let outputString = \"\";\n    console.log(\n      `Stagehand (Browser Process): Processing candidate elements: ${candidateElements.length}`\n    );\n    console.time(\"processElements:processCandidates\");\n    console.time(\"processElements:generateXPaths\");\n    const xpathLists = await Promise.all(\n      candidateElements.map(async (element) => {\n        if (xpathCache.has(element)) {\n          return xpathCache.get(element);\n        }\n        const xpaths = await generateXPathsForElement(element);\n        xpathCache.set(element, xpaths);\n        return xpaths;\n      })\n    );\n    console.timeEnd(\"processElements:generateXPaths\");\n    candidateElements.forEach((element, index) => {\n      const xpaths = xpathLists[index];\n      let elementOutput = \"\";\n      if (isTextNode(element)) {\n        const textContent = element.textContent?.trim();\n        if (textContent) {\n          elementOutput += `${index + indexOffset}:${textContent}\n`;\n        }\n      } else if (isElementNode(element)) {\n        const tagName = element.tagName.toLowerCase();\n        const attributes = collectEssentialAttributes(element);\n        const openingTag = `<${tagName}${attributes ? \" \" + attributes : \"\"}>`;\n        const closingTag = `</${tagName}>`;\n        const textContent = element.textContent?.trim() || \"\";\n        elementOutput += `${index + indexOffset}:${openingTag}${textContent}${closingTag}\n`;\n      }\n      outputString += elementOutput;\n      selectorMap[index + indexOffset] = xpaths;\n    });\n    console.timeEnd(\"processElements:processCandidates\");\n    console.timeEnd(\"processElements:total\");\n    return {\n      outputString,\n      selectorMap\n    };\n  }\n  function collectEssentialAttributes(element) {\n    const essentialAttributes = [\n      \"id\",\n      \"class\",\n      \"href\",\n      \"src\",\n      \"aria-label\",\n      \"aria-name\",\n      \"aria-role\",\n      \"aria-description\",\n      \"aria-expanded\",\n      \"aria-haspopup\",\n      \"type\",\n      \"value\"\n    ];\n    const attrs = essentialAttributes.map((attr) => {\n      const value = element.getAttribute(attr);\n      return value ? `${attr}=\"${value}\"` : \"\";\n    }).filter((attr) => attr !== \"\");\n    Array.from(element.attributes).forEach((attr) => {\n      if (attr.name.startsWith(\"data-\")) {\n        attrs.push(`${attr.name}=\"${attr.value}\"`);\n      }\n    });\n    return attrs.join(\" \");\n  }\n  function storeDOM() {\n    const originalDOM = document.body.cloneNode(true);\n    console.log(\"DOM state stored.\");\n    return originalDOM.outerHTML;\n  }\n  function restoreDOM(storedDOM) {\n    console.log(\"Restoring DOM\");\n    if (storedDOM) {\n      document.body.innerHTML = storedDOM;\n    } else {\n      console.error(\"No DOM state was provided.\");\n    }\n  }\n  function createTextBoundingBoxes() {\n    const style = document.createElement(\"style\");\n    document.head.appendChild(style);\n    if (style.sheet) {\n      style.sheet.insertRule(\n        `\n      .stagehand-highlighted-word, .stagehand-space {\n        border: 0px solid orange;\n        display: inline-block !important;\n        visibility: visible;\n      }\n    `,\n        0\n      );\n      style.sheet.insertRule(\n        `\n        code .stagehand-highlighted-word, code .stagehand-space,\n        pre .stagehand-highlighted-word, pre .stagehand-space {\n          white-space: pre-wrap;\n          display: inline !important;\n      }\n     `,\n        1\n      );\n    }\n    function applyHighlighting(root) {\n      root.querySelectorAll(\"body *\").forEach((element) => {\n        if (element.closest(\".stagehand-nav, .stagehand-marker\")) {\n          return;\n        }\n        if ([\"SCRIPT\", \"STYLE\", \"IFRAME\", \"INPUT\"].includes(element.tagName)) {\n          return;\n        }\n        const childNodes = Array.from(element.childNodes);\n        childNodes.forEach((node) => {\n          if (node.nodeType === 3 && node.textContent?.trim().length > 0) {\n            const textContent = node.textContent.replace(/\\u00A0/g, \" \");\n            const tokens = textContent.split(/(\\s+)/g);\n            const fragment = document.createDocumentFragment();\n            const parentIsCode = element.tagName === \"CODE\";\n            tokens.forEach((token) => {\n              const span = document.createElement(\"span\");\n              span.textContent = token;\n              if (parentIsCode) {\n                span.style.whiteSpace = \"pre-wrap\";\n                span.style.display = \"inline\";\n              }\n              span.className = token.trim().length === 0 ? \"stagehand-space\" : \"stagehand-highlighted-word\";\n              fragment.appendChild(span);\n            });\n            if (fragment.childNodes.length > 0 && node.parentNode) {\n              element.insertBefore(fragment, node);\n              node.remove();\n            }\n          }\n        });\n      });\n    }\n    applyHighlighting(document);\n    document.querySelectorAll(\"iframe\").forEach((iframe) => {\n      try {\n        iframe.contentWindow?.postMessage({ action: \"highlight\" }, \"*\");\n      } catch (error) {\n        console.error(\"Error accessing iframe content: \", error);\n      }\n    });\n  }\n  function getElementBoundingBoxes(xpath) {\n    const element = document.evaluate(\n      xpath,\n      document,\n      null,\n      XPathResult.FIRST_ORDERED_NODE_TYPE,\n      null\n    ).singleNodeValue;\n    if (!element) return [];\n    const isValidText = (text) => text && text.trim().length > 0;\n    let dropDownElem = element.querySelector(\"option[selected]\");\n    if (!dropDownElem) {\n      dropDownElem = element.querySelector(\"option\");\n    }\n    if (dropDownElem) {\n      const elemText = dropDownElem.textContent || \"\";\n      if (isValidText(elemText)) {\n        const parentRect = element.getBoundingClientRect();\n        return [\n          {\n            text: elemText.trim(),\n            top: parentRect.top + window.scrollY,\n            left: parentRect.left + window.scrollX,\n            width: parentRect.width,\n            height: parentRect.height\n          }\n        ];\n      } else {\n        return [];\n      }\n    }\n    let placeholderText = \"\";\n    if ((element.tagName.toLowerCase() === \"input\" || element.tagName.toLowerCase() === \"textarea\") && element.placeholder) {\n      placeholderText = element.placeholder;\n    } else if (element.tagName.toLowerCase() === \"a\") {\n      placeholderText = \"\";\n    } else if (element.tagName.toLowerCase() === \"img\") {\n      placeholderText = element.alt || \"\";\n    }\n    const words = element.querySelectorAll(\n      \".stagehand-highlighted-word\"\n    );\n    const boundingBoxes = Array.from(words).map((word) => {\n      const rect = word.getBoundingClientRect();\n      return {\n        text: word.innerText || \"\",\n        top: rect.top + window.scrollY,\n        left: rect.left + window.scrollX,\n        width: rect.width,\n        height: rect.height * 0.75\n      };\n    }).filter(\n      (box) => box.width > 0 && box.height > 0 && box.top >= 0 && box.left >= 0 && isValidText(box.text)\n    );\n    if (boundingBoxes.length === 0) {\n      const elementRect = element.getBoundingClientRect();\n      return [\n        {\n          text: placeholderText,\n          top: elementRect.top + window.scrollY,\n          left: elementRect.left + window.scrollX,\n          width: elementRect.width,\n          height: elementRect.height * 0.75\n        }\n      ];\n    }\n    return boundingBoxes;\n  }\n  window.processDom = processDom;\n  window.processAllOfDom = processAllOfDom;\n  window.processElements = processElements;\n  window.storeDOM = storeDOM;\n  window.restoreDOM = restoreDOM;\n  window.createTextBoundingBoxes = createTextBoundingBoxes;\n  window.getElementBoundingBoxes = getElementBoundingBoxes;\n  window.createStagehandContainer = createStagehandContainer;\n  var leafElementDenyList = [\"SVG\", \"IFRAME\", \"SCRIPT\", \"STYLE\", \"LINK\"];\n  var interactiveElementTypes = [\n    \"A\",\n    \"BUTTON\",\n    \"DETAILS\",\n    \"EMBED\",\n    \"INPUT\",\n    \"LABEL\",\n    \"MENU\",\n    \"MENUITEM\",\n    \"OBJECT\",\n    \"SELECT\",\n    \"TEXTAREA\",\n    \"SUMMARY\"\n  ];\n  var interactiveRoles = [\n    \"button\",\n    \"menu\",\n    \"menuitem\",\n    \"link\",\n    \"checkbox\",\n    \"radio\",\n    \"slider\",\n    \"tab\",\n    \"tabpanel\",\n    \"textbox\",\n    \"combobox\",\n    \"grid\",\n    \"listbox\",\n    \"option\",\n    \"progressbar\",\n    \"scrollbar\",\n    \"searchbox\",\n    \"switch\",\n    \"tree\",\n    \"treeitem\",\n    \"spinbutton\",\n    \"tooltip\"\n  ];\n  var interactiveAriaRoles = [\"menu\", \"menuitem\", \"button\"];\n  var isVisible = (element) => {\n    const rect = element.getBoundingClientRect();\n    if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.top > window.innerHeight) {\n      return false;\n    }\n    if (!isTopElement(element, rect)) {\n      return false;\n    }\n    const visible = element.checkVisibility({\n      checkOpacity: true,\n      checkVisibilityCSS: true\n    });\n    return visible;\n  };\n  var isTextVisible = (element) => {\n    const range = document.createRange();\n    range.selectNodeContents(element);\n    const rect = range.getBoundingClientRect();\n    if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.top > window.innerHeight) {\n      return false;\n    }\n    const parent = element.parentElement;\n    if (!parent) {\n      return false;\n    }\n    const visible = parent.checkVisibility({\n      checkOpacity: true,\n      checkVisibilityCSS: true\n    });\n    return visible;\n  };\n  function isTopElement(elem, rect) {\n    const points = [\n      { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.25 },\n      { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.25 },\n      { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.75 },\n      { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.75 },\n      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }\n    ];\n    return points.some((point) => {\n      const topEl = document.elementFromPoint(point.x, point.y);\n      let current = topEl;\n      while (current && current !== document.body) {\n        if (current.isSameNode(elem)) {\n          return true;\n        }\n        current = current.parentElement;\n      }\n      return false;\n    });\n  }\n  var isActive = (element) => {\n    if (element.hasAttribute(\"disabled\") || element.hasAttribute(\"hidden\") || element.getAttribute(\"aria-disabled\") === \"true\") {\n      return false;\n    }\n    return true;\n  };\n  var isInteractiveElement = (element) => {\n    const elementType = element.tagName;\n    const elementRole = element.getAttribute(\"role\");\n    const elementAriaRole = element.getAttribute(\"aria-role\");\n    return elementType && interactiveElementTypes.includes(elementType) || elementRole && interactiveRoles.includes(elementRole) || elementAriaRole && interactiveAriaRoles.includes(elementAriaRole);\n  };\n  var isLeafElement = (element) => {\n    if (element.textContent === \"\") {\n      return false;\n    }\n    if (element.childNodes.length === 0) {\n      return !leafElementDenyList.includes(element.tagName);\n    }\n    if (element.childNodes.length === 1 && isTextNode(element.childNodes[0])) {\n      return true;\n    }\n    return false;\n  };\n  async function pickChunk(chunksSeen) {\n    const viewportHeight = calculateViewportHeight();\n    const documentHeight = document.documentElement.scrollHeight;\n    const chunks = Math.ceil(documentHeight / viewportHeight);\n    const chunksArray = Array.from({ length: chunks }, (_, i) => i);\n    const chunksRemaining = chunksArray.filter((chunk2) => {\n      return !chunksSeen.includes(chunk2);\n    });\n    const currentScrollPosition = window.scrollY;\n    const closestChunk = chunksRemaining.reduce((closest, current) => {\n      const currentChunkTop = viewportHeight * current;\n      const closestChunkTop = viewportHeight * closest;\n      return Math.abs(currentScrollPosition - currentChunkTop) < Math.abs(currentScrollPosition - closestChunkTop) ? current : closest;\n    }, chunksRemaining[0]);\n    const chunk = closestChunk;\n    if (chunk === void 0) {\n      throw new Error(`No chunks remaining to check: ${chunksRemaining}`);\n    }\n    return {\n      chunk,\n      chunksArray\n    };\n  }\n\n  // lib/dom/debug.ts\n  async function debugDom() {\n    window.chunkNumber = 0;\n    const { selectorMap: multiSelectorMap } = await window.processElements(\n      window.chunkNumber\n    );\n    const selectorMap = multiSelectorMapToSelectorMap(multiSelectorMap);\n    drawChunk(selectorMap);\n  }\n  function multiSelectorMapToSelectorMap(multiSelectorMap) {\n    return Object.fromEntries(\n      Object.entries(multiSelectorMap).map(([key, selectors]) => [\n        Number(key),\n        selectors[0]\n      ])\n    );\n  }\n  function drawChunk(selectorMap) {\n    if (!window.showChunks) return;\n    cleanupMarkers();\n    Object.values(selectorMap).forEach((selector) => {\n      const element = document.evaluate(\n        selector,\n        document,\n        null,\n        XPathResult.FIRST_ORDERED_NODE_TYPE,\n        null\n      ).singleNodeValue;\n      if (element) {\n        let rect;\n        if (element.nodeType === Node.ELEMENT_NODE) {\n          rect = element.getBoundingClientRect();\n        } else {\n          const range = document.createRange();\n          range.selectNodeContents(element);\n          rect = range.getBoundingClientRect();\n        }\n        const color = \"grey\";\n        const overlay = document.createElement(\"div\");\n        overlay.style.position = \"absolute\";\n        overlay.style.left = `${rect.left + window.scrollX}px`;\n        overlay.style.top = `${rect.top + window.scrollY}px`;\n        overlay.style.padding = \"2px\";\n        overlay.style.width = `${rect.width}px`;\n        overlay.style.height = `${rect.height}px`;\n        overlay.style.backgroundColor = color;\n        overlay.className = \"stagehand-marker\";\n        overlay.style.opacity = \"0.3\";\n        overlay.style.zIndex = \"1000000000\";\n        overlay.style.border = \"1px solid\";\n        overlay.style.pointerEvents = \"none\";\n        document.body.appendChild(overlay);\n      }\n    });\n  }\n  async function cleanupDebug() {\n    cleanupMarkers();\n  }\n  function cleanupMarkers() {\n    const markers = document.querySelectorAll(\".stagehand-marker\");\n    markers.forEach((marker) => {\n      marker.remove();\n    });\n  }\n  window.debugDom = debugDom;\n  window.cleanupDebug = cleanupDebug;\n})();\n";
