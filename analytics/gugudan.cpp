#include <iostream>
#include <iomanip>

using namespace std;

/**
 * @brief 20단 구구단 출력 프로그램
 * @author AI Assistant
 * @date 2024
 * 
 * 1단부터 20단까지의 구구단을 출력합니다.
 * 각 단은 1부터 20까지 곱셈 결과를 보여줍니다.
 */

class Gugudan {
private:
    int maxDan;  // 최대 단 수

public:
    /**
     * @brief 생성자
     * @param max 최대 단 수 (기본값: 20)
     */
    Gugudan(int max = 20) : maxDan(max) {}

    /**
     * @brief 특정 단의 구구단 출력
     * @param dan 출력할 단 수
     */
    void printDan(int dan) {
        cout << "\n========== " << dan << "단 ==========\n";
        for (int i = 1; i <= maxDan; i++) {
            cout << setw(2) << dan << " x " << setw(2) << i 
                 << " = " << setw(4) << (dan * i) << endl;
        }
    }

    /**
     * @brief 모든 구구단 출력 (1단 ~ maxDan단)
     */
    void printAll() {
        cout << "====================================\n";
        cout << "      1단부터 " << maxDan << "단까지 구구단\n";
        cout << "====================================\n";
        
        for (int dan = 1; dan <= maxDan; dan++) {
            printDan(dan);
        }
        
        cout << "\n====================================\n";
        cout << "           구구단 종료\n";
        cout << "====================================\n";
    }

    /**
     * @brief 테이블 형식으로 구구단 출력 (가로로 여러 단 동시 표시)
     * @param columnsPerRow 한 줄에 표시할 단의 개수
     */
    void printTable(int columnsPerRow = 5) {
        cout << "\n====================================\n";
        cout << "   구구단 테이블 (1 ~ " << maxDan << "단)\n";
        cout << "====================================\n";

        for (int startDan = 1; startDan <= maxDan; startDan += columnsPerRow) {
            int endDan = min(startDan + columnsPerRow - 1, maxDan);
            
            // 헤더 출력
            cout << "\n";
            for (int dan = startDan; dan <= endDan; dan++) {
                cout << "   [" << setw(2) << dan << "단]   ";
            }
            cout << "\n";
            cout << string(columnsPerRow * 13, '-') << "\n";

            // 곱셈 결과 출력
            for (int i = 1; i <= maxDan; i++) {
                for (int dan = startDan; dan <= endDan; dan++) {
                    cout << setw(2) << dan << "x" << setw(2) << i 
                         << "=" << setw(4) << (dan * i) << "  ";
                }
                cout << "\n";
            }
        }
    }

    /**
     * @brief 특정 배수의 결과만 출력
     * @param multiplier 찾을 배수
     */
    void findMultiples(int multiplier) {
        cout << "\n====== " << multiplier << "의 배수 찾기 ======\n";
        for (int dan = 1; dan <= maxDan; dan++) {
            for (int i = 1; i <= maxDan; i++) {
                int result = dan * i;
                if (result == multiplier) {
                    cout << dan << " x " << i << " = " << result << endl;
                }
            }
        }
    }
};

/**
 * @brief 사용자 메뉴 출력
 */
void printMenu() {
    cout << "\n====================================\n";
    cout << "         20단 구구단 프로그램\n";
    cout << "====================================\n";
    cout << "1. 전체 구구단 출력 (세로)\n";
    cout << "2. 구구단 테이블 출력 (가로)\n";
    cout << "3. 특정 단만 출력\n";
    cout << "4. 특정 배수 찾기\n";
    cout << "5. 종료\n";
    cout << "====================================\n";
    cout << "선택: ";
}

/**
 * @brief 메인 함수
 */
int main() {
    Gugudan gugudan(20);
    int choice;
    
    while (true) {
        printMenu();
        cin >> choice;

        switch (choice) {
            case 1:
                gugudan.printAll();
                break;
            
            case 2:
                gugudan.printTable(5);  // 한 줄에 5단씩 표시
                break;
            
            case 3: {
                int dan;
                cout << "몇 단을 출력하시겠습니까? (1-20): ";
                cin >> dan;
                if (dan >= 1 && dan <= 20) {
                    gugudan.printDan(dan);
                } else {
                    cout << "1에서 20 사이의 숫자를 입력하세요.\n";
                }
                break;
            }
            
            case 4: {
                int multiplier;
                cout << "찾을 배수를 입력하세요: ";
                cin >> multiplier;
                gugudan.findMultiples(multiplier);
                break;
            }
            
            case 5:
                cout << "\n프로그램을 종료합니다.\n";
                return 0;
            
            default:
                cout << "\n잘못된 선택입니다. 1-5 사이의 숫자를 입력하세요.\n";
        }
        
        // 계속 진행을 위한 대기
        cout << "\nEnter 키를 눌러 계속...";
        cin.ignore();
        cin.get();
    }

    return 0;
}
