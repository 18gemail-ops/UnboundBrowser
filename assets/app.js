/**
 * 无界指纹浏览器 · 官网交互
 * 1. 滚动后导航栏实底化（毛玻璃）
 * 2. 元素进入视口时渐入（含同组错峰）
 * 3. 页脚年份自动更新
 */
;(function () {
  'use strict'

  // ---- 导航栏滚动态 ----
  var header = document.getElementById('siteHeader')
  var onScroll = function () {
    if (window.scrollY > 8) {
      header.classList.add('scrolled')
    } else {
      header.classList.remove('scrolled')
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // ---- 滚动渐入 ----
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'))

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          var el = entry.target
          // 同容器内的兄弟元素错峰入场
          var siblings = el.parentElement
            ? Array.prototype.filter.call(el.parentElement.children, function (c) {
                return c.classList && c.classList.contains('reveal')
              })
            : [el]
          var index = Math.max(0, siblings.indexOf(el))
          el.style.transitionDelay = Math.min(index * 70, 420) + 'ms'
          el.classList.add('visible')
          io.unobserve(el)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )
    revealEls.forEach(function (el) {
      io.observe(el)
    })
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('visible')
    })
  }

  // ---- 页脚年份 ----
  var yearEl = document.getElementById('year')
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear())
  }

  // ---- 界面巡览：图片灯箱 ----
  var lightbox = document.getElementById('lightbox')
  var galleryItems = document.querySelectorAll('.gallery-item')
  if (lightbox && galleryItems.length) {
    var lbImg = document.getElementById('lightboxImg')
    var lbTitle = document.getElementById('lightboxTitle')
    var lbClose = document.getElementById('lightboxClose')
    var closeTimer = null

    var openLightbox = function (fig) {
      var img = fig.querySelector('img')
      if (!img) return
      if (closeTimer) {
        clearTimeout(closeTimer)
        closeTimer = null
      }
      lbImg.src = img.src
      lbImg.alt = img.alt || ''
      lbTitle.textContent = fig.getAttribute('data-title') || ''
      lightbox.hidden = false
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          lightbox.classList.add('open')
        })
      })
      document.body.style.overflow = 'hidden'
    }

    var closeLightbox = function () {
      lightbox.classList.remove('open')
      document.body.style.overflow = ''
      closeTimer = setTimeout(function () {
        lightbox.hidden = true
      }, 260)
    }

    Array.prototype.forEach.call(galleryItems, function (fig) {
      fig.addEventListener('click', function () {
        openLightbox(fig)
      })
    })

    if (lbClose) {
      lbClose.addEventListener('click', closeLightbox)
    }
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox()
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox()
    })
  }

  // ---- 数据条：数字滚动 ----
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'))
  var prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  var animateCount = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0
    if (prefersReduced) {
      el.textContent = String(target)
      return
    }
    var start = null
    var duration = 1100
    var tick = function (ts) {
      if (start === null) start = ts
      var p = Math.min(1, (ts - start) / duration)
      var eased = 1 - Math.pow(1 - p, 3)
      el.textContent = String(Math.round(target * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return
            animateCount(entry.target)
            counterIo.unobserve(entry.target)
          })
        },
        { threshold: 0.6 }
      )
      counters.forEach(function (el) {
        counterIo.observe(el)
      })
    } else {
      counters.forEach(animateCount)
    }
  }

  // ---- 使用手册：目录滚动高亮 ----
  var tocLinks = Array.prototype.slice.call(
    document.querySelectorAll('.manual-toc a[href^="#"]')
  )
  if (tocLinks.length) {
    var spyItems = []
    tocLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1))
      if (sec) spyItems.push({ link: a, section: sec })
    })

    var onSpy = function () {
      if (!spyItems.length) return
      var pos = window.scrollY + 130
      var current = spyItems[0]
      spyItems.forEach(function (item) {
        if (item.section.getBoundingClientRect().top + window.scrollY <= pos) {
          current = item
        }
      })
      spyItems.forEach(function (item) {
        item.link.classList.toggle('active', item === current)
      })
    }

    window.addEventListener('scroll', onSpy, { passive: true })
    onSpy()
  }

  // ---- 复制按钮（如 SHA-256 校验值） ----
  var copyBtns = Array.prototype.slice.call(document.querySelectorAll('[data-copy]'))
  copyBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.getAttribute('data-copy'))
      if (!target) return
      var text = target.textContent.trim()
      var flash = function () {
        var old = btn.textContent
        btn.textContent = '已复制'
        btn.classList.add('copied')
        setTimeout(function () {
          btn.textContent = old
          btn.classList.remove('copied')
        }, 1600)
      }
      var fallbackCopy = function () {
        var ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          flash()
        } catch (err) {}
        document.body.removeChild(ta)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flash, fallbackCopy)
      } else {
        fallbackCopy()
      }
    })
  })
})()
